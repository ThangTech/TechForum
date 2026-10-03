using System.Globalization;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed partial class TopicService(
    ITopicRepository topicRepository,
    IMediaAssetRepository mediaAssetRepository,
    IContentSanitizer contentSanitizer,
    TimeProvider timeProvider) : ITopicService
{
    public async Task<PagedResultDto<TopicSummaryDto>> GetPublicPageAsync(
        TopicQuery query,
        CancellationToken cancellationToken)
    {
        var page = await topicRepository.GetPublicPageAsync(query, cancellationToken);
        var totalPages = page.TotalItems == 0
            ? 0
            : (int)Math.Ceiling(page.TotalItems / (double)query.PageSize);

        return new PagedResultDto<TopicSummaryDto>(
            page.Items.Select(MapSummary).ToList(),
            query.Page,
            query.PageSize,
            page.TotalItems,
            totalPages);
    }

    public async Task<TopicDetailDto?> GetPublicByIdAsync(int id, CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetPublicByIdAsync(id, cancellationToken);
        return topic is null ? null : MapDetail(topic);
    }

    public async Task<PagedResultDto<OwnTopicSummaryDto>> GetOwnedPageAsync(
        string authorId,
        TopicQuery query,
        CancellationToken cancellationToken)
    {
        var page = await topicRepository.GetOwnedPageAsync(authorId, query, cancellationToken);
        var totalPages = page.TotalItems == 0
            ? 0
            : (int)Math.Ceiling(page.TotalItems / (double)query.PageSize);

        return new PagedResultDto<OwnTopicSummaryDto>(
            page.Items.Select(MapOwnedSummary).ToList(),
            query.Page,
            query.PageSize,
            page.TotalItems,
            totalPages);
    }

    public async Task<CreateTopicResult> CreateAsync(
        string authorId,
        CreateTopicRequest request,
        CancellationToken cancellationToken)
    {
        var title = request.Title?.Trim();
        if (string.IsNullOrWhiteSpace(title) || title.Length is < 10 or > 200)
        {
            return CreateTopicResult.ValidationError(
                "title",
                "Tiêu đề phải có từ 10 đến 200 ký tự.");
        }

        var summary = request.Summary?.Trim();
        if (string.IsNullOrWhiteSpace(summary) || summary.Length is < 20 or > 500)
        {
            return CreateTopicResult.ValidationError(
                "summary",
                "Tóm tắt phải có từ 20 đến 500 ký tự.");
        }

        if (!TryParseType(request.Type, out var type))
        {
            return CreateTopicResult.ValidationError(
                "type",
                "Loại nội dung phải là 'article' hoặc 'question'.");
        }

        if (request.BodyHtml is null || request.BodyHtml.Length > 100_000)
        {
            return CreateTopicResult.ValidationError(
                "bodyHtml",
                "Nội dung không được để trống hoặc vượt quá 100.000 ký tự.");
        }

        var sanitizedBody = contentSanitizer.Sanitize(request.BodyHtml).Trim();
        if (!HasMeaningfulContent(sanitizedBody))
        {
            return CreateTopicResult.ValidationError(
                "bodyHtml",
                "Nội dung phải có văn bản hoặc media hợp lệ.");
        }

        var category = await topicRepository.GetCategoryByIdAsync(
            request.CategoryId,
            cancellationToken);
        if (category is null)
        {
            return CreateTopicResult.ValidationError("categoryId", "Chuyên mục không tồn tại.");
        }

        var tagIds = (request.TagIds ?? []).Distinct().ToArray();
        if (tagIds.Length > 5 || tagIds.Any(id => id <= 0))
        {
            return CreateTopicResult.ValidationError(
                "tagIds",
                "Chỉ được chọn tối đa 5 thẻ hợp lệ.");
        }

        var tags = await topicRepository.GetActiveTagsByIdsAsync(tagIds, cancellationToken);
        if (tags.Count != tagIds.Length)
        {
            return CreateTopicResult.ValidationError(
                "tagIds",
                "Một hoặc nhiều thẻ không tồn tại hoặc đã ngừng sử dụng.");
        }

        var mediaIds = (request.MediaIds ?? []).Distinct().ToArray();
        if (mediaIds.Length > 20 || mediaIds.Any(id => id == Guid.Empty))
        {
            return CreateTopicResult.ValidationError(
                "mediaIds",
                "Chỉ được dùng tối đa 20 media hợp lệ trong một nội dung.");
        }

        var mediaAssets = await mediaAssetRepository.GetOwnedUnattachedByIdsAsync(
            mediaIds,
            authorId,
            cancellationToken);
        if (mediaAssets.Count != mediaIds.Length)
        {
            return CreateTopicResult.ValidationError(
                "mediaIds",
                "Một hoặc nhiều media không tồn tại, đã được sử dụng hoặc không thuộc tài khoản này.");
        }

        var embeddedMediaUrls = MediaUrl().Matches(sanitizedBody)
            .Select(match => match.Value)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        if (embeddedMediaUrls.Length != mediaAssets.Count ||
            mediaAssets.Any(asset => !embeddedMediaUrls.Contains(
                asset.PublicUrl,
                StringComparer.OrdinalIgnoreCase)))
        {
            return CreateTopicResult.ValidationError(
                "mediaIds",
                "Danh sách media không khớp với ảnh hoặc video trong nội dung.");
        }

        var slug = await CreateUniqueSlugAsync(title, cancellationToken);
        var now = timeProvider.GetUtcNow();
        var topic = new Topic
        {
            Title = title,
            Slug = slug,
            Summary = summary,
            BodyHtml = sanitizedBody,
            Type = type,
            Status = request.Publish ? TopicStatus.Published : TopicStatus.Draft,
            CategoryId = category.Id,
            AuthorId = authorId,
            CreatedAtUtc = now,
            PublishedAtUtc = request.Publish ? now : null,
            TopicTags = tags.Select(tag => new TopicTag { TagId = tag.Id }).ToList(),
            MediaAssets = mediaAssets.ToList()
        };

        await topicRepository.AddAsync(topic, cancellationToken);

        return CreateTopicResult.Success(new OwnTopicDto(
            topic.Id,
            topic.Title,
            topic.Slug,
            topic.Summary,
            topic.BodyHtml,
            MapType(topic.Type),
            topic.Status == TopicStatus.Published ? "published" : "draft",
            new TopicCategoryDto(category.Id, category.Name, category.Slug),
            tags.Select(tag => new TopicTagDto(tag.Id, tag.Name, tag.Slug)).ToList(),
            topic.CreatedAtUtc,
            topic.PublishedAtUtc));
    }

    private async Task<string> CreateUniqueSlugAsync(
        string title,
        CancellationToken cancellationToken)
    {
        var baseSlug = CreateSlug(title);
        var candidate = baseSlug;
        var suffix = 2;
        while (await topicRepository.SlugExistsAsync(candidate, cancellationToken))
        {
            candidate = $"{baseSlug}-{suffix}";
            suffix++;
        }

        return candidate;
    }

    private static string CreateSlug(string value)
    {
        var normalized = value
            .Replace('đ', 'd')
            .Replace('Đ', 'D')
            .Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        var slug = NonSlugCharacters().Replace(builder.ToString().ToLowerInvariant(), "-").Trim('-');
        return string.IsNullOrWhiteSpace(slug) ? "noi-dung" : slug[..Math.Min(slug.Length, 180)].TrimEnd('-');
    }

    private static bool HasMeaningfulContent(string html)
    {
        var text = WebUtility.HtmlDecode(HtmlTags().Replace(html, string.Empty)).Trim();
        return !string.IsNullOrWhiteSpace(text) || MediaUrl().IsMatch(html);
    }

    private static bool TryParseType(string? value, out TopicType type)
    {
        if (string.Equals(value?.Trim(), "article", StringComparison.OrdinalIgnoreCase))
        {
            type = TopicType.Article;
            return true;
        }

        if (string.Equals(value?.Trim(), "question", StringComparison.OrdinalIgnoreCase))
        {
            type = TopicType.Question;
            return true;
        }

        type = default;
        return false;
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonSlugCharacters();

    [GeneratedRegex("<[^>]+>")]
    private static partial Regex HtmlTags();

    [GeneratedRegex(@"/media/(?:images|videos)/[a-f0-9]{32}\.(?:png|jpg|gif|webp|mp4|webm)", RegexOptions.IgnoreCase)]
    private static partial Regex MediaUrl();

    private static TopicSummaryDto MapSummary(Topic topic) => new(
        topic.Id,
        topic.Title,
        topic.Slug,
        topic.Summary,
        MapType(topic.Type),
        MapCategory(topic),
        MapAuthor(topic),
        MapTags(topic),
        topic.PublishedAtUtc!.Value,
        topic.IsPinned,
        topic.IsDiscussionLocked);

    private static TopicDetailDto MapDetail(Topic topic) => new(
        topic.Id,
        topic.Title,
        topic.Slug,
        topic.Summary,
        topic.BodyHtml,
        MapType(topic.Type),
        MapCategory(topic),
        MapAuthor(topic),
        MapTags(topic),
        topic.CreatedAtUtc,
        topic.PublishedAtUtc!.Value,
        topic.UpdatedAtUtc,
        topic.IsPinned,
        topic.IsDiscussionLocked);

    private static OwnTopicSummaryDto MapOwnedSummary(Topic topic) => new(
        topic.Id,
        topic.Title,
        topic.Summary,
        MapType(topic.Type),
        topic.Status == TopicStatus.Published ? "published" : "draft",
        MapCategory(topic),
        MapTags(topic),
        topic.CreatedAtUtc,
        topic.UpdatedAtUtc,
        topic.PublishedAtUtc,
        topic.IsHiddenByModerator,
        topic.IsDiscussionLocked);

    private static string MapType(TopicType type) => type switch
    {
        TopicType.Article => "article",
        TopicType.Question => "question",
        _ => throw new InvalidOperationException($"Unsupported topic type: {type}")
    };

    private static TopicCategoryDto MapCategory(Topic topic) =>
        new(topic.Category.Id, topic.Category.Name, topic.Category.Slug);

    private static TopicAuthorDto MapAuthor(Topic topic) =>
        new(topic.Author.Id, topic.Author.DisplayName);

    private static IReadOnlyList<TopicTagDto> MapTags(Topic topic) => topic.TopicTags
        .Where(item => item.Tag.IsActive)
        .OrderBy(item => item.Tag.Name)
        .ThenBy(item => item.TagId)
        .Select(item => new TopicTagDto(item.TagId, item.Tag.Name, item.Tag.Slug))
        .ToList();
}
