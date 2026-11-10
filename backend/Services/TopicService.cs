using System.Diagnostics.CodeAnalysis;
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
    IDraftRepository draftRepository,
    IContentSanitizer contentSanitizer,
    MediaUrlRules mediaUrlRules,
    TimeProvider timeProvider) : ITopicService
{
    private const int MaxSlugAttempts = 5;

    public async Task<PagedResultDto<TopicSummaryDto>> GetPublicPageAsync(
        TopicQuery query,
        CancellationToken cancellationToken)
    {
        var page = await topicRepository.GetPublicPageAsync(query, cancellationToken);
        return MapPublicPage(page, query);
    }

    public async Task<PagedResultDto<TopicSummaryDto>> GetFollowingPageAsync(
        string followerId,
        TopicQuery query,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(followerId);
        var page = await topicRepository.GetFollowingPageAsync(followerId, query, cancellationToken);
        return MapPublicPage(page, query);
    }

    private static PagedResultDto<TopicSummaryDto> MapPublicPage(TopicPage page, TopicQuery query)
    {
        var totalPages = page.TotalItems == 0
            ? 0
            : (int)Math.Ceiling(page.TotalItems / (double)query.PageSize);

        return new PagedResultDto<TopicSummaryDto>(
            page.Items.Select(topic => MapSummary(topic) with
            {
                Discussion = page.Discussions?.GetValueOrDefault(topic.Id)
            }).ToList(),
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

    public async Task<OwnTopicDto?> GetOwnedByIdAsync(
        int id,
        string authorId,
        CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetOwnedByIdAsync(id, authorId, cancellationToken);
        return topic is null ? null : MapOwnTopic(topic);
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
        var form = new TopicForm(
            request.Title,
            request.Summary,
            request.Type,
            request.BodyHtml,
            request.CategoryId,
            request.TagIds,
            request.MediaIds);
        var validation = await ValidateFormAsync(form, authorId, editingTopicId: null, cancellationToken);
        if (!validation.IsValid)
        {
            return validation.Error;
        }

        var values = validation.Values;
        var slug = await CreateUniqueSlugAsync(values.Title, cancellationToken);
        var now = timeProvider.GetUtcNow();
        var topic = new Topic
        {
            Title = values.Title,
            Slug = slug,
            Summary = values.Summary,
            BodyHtml = values.SanitizedBody,
            CoverImageUrl = mediaUrlRules.FindFirstImageUrl(values.SanitizedBody),
            Type = values.Type,
            Status = request.Publish ? TopicStatus.Published : TopicStatus.Draft,
            CategoryId = values.Category.Id,
            AuthorId = authorId,
            CreatedAtUtc = now,
            PublishedAtUtc = request.Publish ? now : null,
            TopicTags = values.Tags.Select(tag => new TopicTag { TagId = tag.Id }).ToList(),
            MediaAssets = values.MediaAssets.ToList()
        };

        if (!await TryAddWithUniqueSlugAsync(topic, values.Title, cancellationToken))
        {
            return CreateTopicResult.ValidationError(
                "title",
                "Không thể tạo đường dẫn riêng cho tiêu đề này lúc này. Vui lòng thử lại.");
        }

        // The topic is saved, so the automatic draft of the new topic is not needed any more.
        await draftRepository.DeleteForTargetAsync(authorId, null, cancellationToken);
        return CreateTopicResult.Success(MapSavedTopic(topic, values));
    }

    public async Task<CreateTopicResult?> UpdateAsync(
        int id,
        string authorId,
        UpdateTopicRequest request,
        CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetOwnedByIdAsync(id, authorId, cancellationToken);
        if (topic is null)
        {
            return null;
        }

        // Going back to draft hides the whole topic, including the answers of other members.
        // A topic with public answers cannot be deleted by its author, so it cannot be hidden this way either.
        var wouldBecomeDraft = topic.Status == TopicStatus.Published && !request.Publish;
        if (wouldBecomeDraft && await topicRepository.HasPublicAnswersAsync(topic.Id, cancellationToken))
        {
            return CreateTopicResult.Conflict(
                "Nội dung đã có câu trả lời công khai nên không thể chuyển về bản nháp. " +
                "Bạn có thể giữ nguyên bài đã xuất bản hoặc liên hệ quản trị viên khi cần xử lý.");
        }

        var form = new TopicForm(
            request.Title,
            request.Summary,
            request.Type,
            request.BodyHtml,
            request.CategoryId,
            request.TagIds,
            request.MediaIds);
        var validation = await ValidateFormAsync(form, authorId, topic.Id, cancellationToken);
        if (!validation.IsValid)
        {
            return validation.Error;
        }

        var values = validation.Values;
        topic.Title = values.Title;
        topic.Summary = values.Summary;
        topic.BodyHtml = values.SanitizedBody;
        topic.CoverImageUrl = mediaUrlRules.FindFirstImageUrl(values.SanitizedBody);
        topic.Type = values.Type;
        if (values.Type == TopicType.Article)
        {
            topic.AcceptedAnswerId = null;
        }

        topic.CategoryId = values.Category.Id;
        topic.Status = request.Publish ? TopicStatus.Published : TopicStatus.Draft;
        topic.PublishedAtUtc = request.Publish ? topic.PublishedAtUtc ?? timeProvider.GetUtcNow() : null;
        topic.UpdatedAtUtc = timeProvider.GetUtcNow();

        foreach (var topicTag in topic.TopicTags.Where(item => !values.TagIds.Contains(item.TagId)).ToList())
        {
            topic.TopicTags.Remove(topicTag);
        }

        foreach (var tag in values.Tags.Where(tag => topic.TopicTags.All(item => item.TagId != tag.Id)))
        {
            topic.TopicTags.Add(new TopicTag { TopicId = topic.Id, TagId = tag.Id, Tag = tag });
        }

        foreach (var mediaAsset in topic.MediaAssets.Where(item => !values.MediaIds.Contains(item.Id)).ToList())
        {
            topic.MediaAssets.Remove(mediaAsset);
        }

        foreach (var mediaAsset in values.MediaAssets.Where(item => topic.MediaAssets.All(current => current.Id != item.Id)))
        {
            topic.MediaAssets.Add(mediaAsset);
        }

        await topicRepository.SaveChangesAsync(cancellationToken);
        await draftRepository.DeleteForTargetAsync(authorId, topic.Id, cancellationToken);
        return CreateTopicResult.Success(MapSavedTopic(topic, values));
    }

    public async Task<SoftDeleteTopicResult> SoftDeleteAsync(
        int id,
        string authorId,
        CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetOwnedByIdAsync(id, authorId, cancellationToken);
        if (topic is null)
        {
            return SoftDeleteTopicResult.Failed(SoftDeleteTopicFailure.NotFound);
        }

        if (await topicRepository.HasPublicAnswersAsync(id, cancellationToken))
        {
            return SoftDeleteTopicResult.Failed(SoftDeleteTopicFailure.HasPublicAnswers);
        }

        topic.IsDeleted = true;
        topic.UpdatedAtUtc = timeProvider.GetUtcNow();
        await topicRepository.SaveChangesAsync(cancellationToken);
        await draftRepository.DeleteForTargetAsync(authorId, id, cancellationToken);
        return SoftDeleteTopicResult.Success();
    }

    // The fields of the "write a topic" form. Creating and editing send the same fields.
    private sealed record TopicForm(
        string? Title,
        string? Summary,
        string? Type,
        string? BodyHtml,
        int CategoryId,
        IReadOnlyList<int>? TagIds,
        IReadOnlyList<Guid>? MediaIds);

    // The form after every check passed: text trimmed, HTML cleaned, and the category, tags and
    // media loaded from the database.
    private sealed record ValidatedTopic(
        string Title,
        string Summary,
        TopicType Type,
        string SanitizedBody,
        Category Category,
        IReadOnlyList<Tag> Tags,
        int[] TagIds,
        Guid[] MediaIds,
        IReadOnlyList<MediaAsset> MediaAssets);

    private sealed class TopicValidation
    {
        private readonly ValidatedTopic? values;
        private readonly CreateTopicResult? error;

        private TopicValidation(ValidatedTopic? values, CreateTopicResult? error)
        {
            this.values = values;
            this.error = error;
        }

        [MemberNotNullWhen(true, nameof(Values))]
        [MemberNotNullWhen(false, nameof(Error))]
        public bool IsValid => values is not null;

        public ValidatedTopic? Values => values;

        public CreateTopicResult? Error => error;

        public static TopicValidation Valid(ValidatedTopic values) => new(values, null);

        public static TopicValidation Invalid(string field, string message) =>
            new(null, CreateTopicResult.ValidationError(field, message));
    }

    // Checks the form of a new topic (editingTopicId is null) or of a topic that is being edited.
    // The checks run in a fixed order and the first problem is reported.
    private async Task<TopicValidation> ValidateFormAsync(
        TopicForm form,
        string authorId,
        int? editingTopicId,
        CancellationToken cancellationToken)
    {
        var title = form.Title?.Trim();
        if (string.IsNullOrWhiteSpace(title) || title.Length is < 10 or > 200)
        {
            return TopicValidation.Invalid("title", "Tiêu đề phải có từ 10 đến 200 ký tự.");
        }

        var summary = form.Summary?.Trim();
        if (string.IsNullOrWhiteSpace(summary) || summary.Length is < 20 or > 500)
        {
            return TopicValidation.Invalid("summary", "Tóm tắt phải có từ 20 đến 500 ký tự.");
        }

        if (!TryParseType(form.Type, out var type))
        {
            return TopicValidation.Invalid("type", "Loại nội dung phải là 'article' hoặc 'question'.");
        }

        if (form.BodyHtml is null || form.BodyHtml.Length > 100_000)
        {
            return TopicValidation.Invalid("bodyHtml", "Nội dung không được để trống hoặc vượt quá 100.000 ký tự.");
        }

        var sanitizedBody = contentSanitizer.Sanitize(form.BodyHtml).Trim();
        if (!HasMeaningfulContent(sanitizedBody))
        {
            return TopicValidation.Invalid("bodyHtml", "Nội dung phải có văn bản hoặc media hợp lệ.");
        }

        var category = await topicRepository.GetCategoryByIdAsync(form.CategoryId, cancellationToken);
        if (category is null)
        {
            return TopicValidation.Invalid("categoryId", "Chuyên mục không tồn tại.");
        }

        var tagIds = (form.TagIds ?? []).Distinct().ToArray();
        if (tagIds.Length > 5 || tagIds.Any(tagId => tagId <= 0))
        {
            return TopicValidation.Invalid("tagIds", "Chỉ được chọn tối đa 5 thẻ hợp lệ.");
        }

        var tags = await topicRepository.GetActiveTagsByIdsAsync(tagIds, cancellationToken);
        if (tags.Count != tagIds.Length)
        {
            return TopicValidation.Invalid("tagIds", "Một hoặc nhiều thẻ không tồn tại hoặc đã ngừng sử dụng.");
        }

        var mediaIds = (form.MediaIds ?? []).Distinct().ToArray();
        if (mediaIds.Length > 20 || mediaIds.Any(mediaId => mediaId == Guid.Empty))
        {
            return TopicValidation.Invalid("mediaIds", "Chỉ được dùng tối đa 20 media hợp lệ trong một nội dung.");
        }

        // A new topic can only use media that is not attached to anything yet. An edited topic can also keep
        // the media it already has.
        var mediaAssets = editingTopicId is { } topicId
            ? await mediaAssetRepository.GetOwnedAvailableForTopicByIdsAsync(mediaIds, authorId, topicId, cancellationToken)
            : await mediaAssetRepository.GetOwnedUnattachedByIdsAsync(mediaIds, authorId, cancellationToken);
        if (mediaAssets.Count != mediaIds.Length)
        {
            return TopicValidation.Invalid(
                "mediaIds",
                editingTopicId is null
                    ? "Một hoặc nhiều media không tồn tại, đã được sử dụng hoặc không thuộc tài khoản này."
                    : "Một hoặc nhiều media không hợp lệ hoặc không thuộc tài khoản này.");
        }

        var embeddedMediaUrls = mediaUrlRules.FindTopicMediaUrls(sanitizedBody)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        if (embeddedMediaUrls.Length != mediaAssets.Count ||
            mediaAssets.Any(asset => !embeddedMediaUrls.Contains(asset.PublicUrl, StringComparer.OrdinalIgnoreCase)))
        {
            return TopicValidation.Invalid("mediaIds", "Danh sách media không khớp với ảnh hoặc video trong nội dung.");
        }

        return TopicValidation.Valid(new ValidatedTopic(
            title, summary, type, sanitizedBody, category, tags, tagIds, mediaIds, mediaAssets));
    }

    // The answer of the create and edit calls: the saved topic plus the category, tags and media that were checked.
    private static OwnTopicDto MapSavedTopic(Topic topic, ValidatedTopic values) => new(
        topic.Id,
        topic.Title,
        topic.Slug,
        topic.Summary,
        topic.BodyHtml,
        MapType(topic.Type),
        topic.Status == TopicStatus.Published ? "published" : "draft",
        new TopicCategoryDto(values.Category.Id, values.Category.Name, values.Category.Slug),
        values.Tags.Select(tag => new TopicTagDto(tag.Id, tag.Name, tag.Slug)).ToList(),
        values.MediaAssets.Select(MapMedia).ToList(),
        topic.CreatedAtUtc,
        topic.PublishedAtUtc);

    // Two requests with the same title can both see the same slug as free. The database accepts only
    // one of them, so the other one picks another slug and saves again. After the first conflict it
    // takes the next free number (a nice slug). If many requests collide in a row they would all pick the
    // same next number again, so after the second conflict it adds a short random part instead.
    private async Task<bool> TryAddWithUniqueSlugAsync(
        Topic topic,
        string title,
        CancellationToken cancellationToken)
    {
        for (var attempt = 1; attempt <= MaxSlugAttempts; attempt++)
        {
            if (await topicRepository.TryAddAsync(topic, cancellationToken))
            {
                return true;
            }

            topic.Slug = attempt == 1
                ? await CreateUniqueSlugAsync(title, cancellationToken)
                : $"{CreateSlug(title)}-{Guid.NewGuid().ToString("N")[..6]}";
        }

        return false;
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

    private bool HasMeaningfulContent(string html)
    {
        var text = WebUtility.HtmlDecode(HtmlTags().Replace(html, string.Empty)).Trim();
        return !string.IsNullOrWhiteSpace(text) || mediaUrlRules.FindTopicMediaUrls(html).Count > 0;
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
        topic.IsDiscussionLocked,
        topic.ViewCount,
        topic.ShareCount,
        CoverImageUrl: topic.CoverImageUrl);

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
        topic.IsDiscussionLocked,
        topic.ViewCount,
        topic.ShareCount,
        ReputationRules.ForDisplay(topic.Score));

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

    private static OwnTopicDto MapOwnTopic(Topic topic) => new(
        topic.Id,
        topic.Title,
        topic.Slug,
        topic.Summary,
        topic.BodyHtml,
        MapType(topic.Type),
        topic.Status == TopicStatus.Published ? "published" : "draft",
        MapCategory(topic),
        MapTags(topic),
        topic.MediaAssets.OrderBy(item => item.CreatedAtUtc).Select(MapMedia).ToList(),
        topic.CreatedAtUtc,
        topic.PublishedAtUtc);

    private static TopicMediaDto MapMedia(MediaAsset mediaAsset) =>
        new(mediaAsset.Id, mediaAsset.PublicUrl, mediaAsset.ContentType);

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
