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

public sealed partial class TopicService : ITopicService
{
    private const int MaxSlugAttempts = 5;
    private const string NotFoundTitle = "Không tìm thấy nội dung";
    private const string NotFoundMessage = "Nội dung không tồn tại hoặc không thuộc tài khoản này.";
    private const string InvalidTitle = "Nội dung gửi lên chưa hợp lệ";

    private readonly ITopicRepository topicRepository;
    private readonly IMediaAssetRepository mediaAssetRepository;
    private readonly IDraftRepository draftRepository;
    private readonly IContentSanitizer contentSanitizer;
    private readonly MediaUrlRules mediaUrlRules;
    private readonly TimeProvider timeProvider;
    private readonly IPostingRateLimiter postingRateLimiter;

    public TopicService(
        ITopicRepository topicRepository,
        IMediaAssetRepository mediaAssetRepository,
        IDraftRepository draftRepository,
        IContentSanitizer contentSanitizer,
        MediaUrlRules mediaUrlRules,
        TimeProvider timeProvider,
        IPostingRateLimiter postingRateLimiter)
    {
        this.topicRepository = topicRepository;
        this.mediaAssetRepository = mediaAssetRepository;
        this.draftRepository = draftRepository;
        this.contentSanitizer = contentSanitizer;
        this.mediaUrlRules = mediaUrlRules;
        this.timeProvider = timeProvider;
        this.postingRateLimiter = postingRateLimiter;
    }

    public async Task<PagedResultDto<TopicSummaryDto>> GetPublicPageAsync(
        TopicQuery query,
        CancellationToken cancellationToken)
    {
        var page = await topicRepository.GetPublicPageAsync(query, cancellationToken);
        return MapPublicPage(page, query, timeProvider.GetUtcNow());
    }

    public async Task<PagedResultDto<TopicSummaryDto>> GetFollowingPageAsync(
        string followerId,
        TopicQuery query,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(followerId);
        var page = await topicRepository.GetFollowingPageAsync(followerId, query, cancellationToken);
        return MapPublicPage(page, query, timeProvider.GetUtcNow());
    }

    private static PagedResultDto<TopicSummaryDto> MapPublicPage(TopicPage page, TopicQuery query, DateTimeOffset now)
    {
        var totalPages = page.TotalItems == 0
            ? 0
            : (int)Math.Ceiling(page.TotalItems / (double)query.PageSize);

        return new PagedResultDto<TopicSummaryDto>(
            page.Items.Select(topic => MapSummary(topic, now) with
            {
                Discussion = page.Discussions?.GetValueOrDefault(topic.Id)
            }).ToList(),
            query.Page,
            query.PageSize,
            page.TotalItems,
            totalPages);
    }

    public async Task<TopicDetailDto?> GetPublicByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetPublicByIdAsync(id, cancellationToken);
        return topic is null ? null : MapDetail(topic, timeProvider.GetUtcNow());
    }

    public async Task<OwnTopicDto?> GetOwnedByIdAsync(
        Guid id,
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

    public async Task<Result<OwnTopicDto>> CreateAsync(
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

        // Chỉ tính khi xuất bản và bài đã hợp lệ; lưu bản nháp thì không tính.
        if (request.Publish && !postingRateLimiter.TryAcquireTopic(authorId, out var retryAfter))
        {
            return PostingTooFast(retryAfter, "đăng bài tiếp");
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
            return Result<OwnTopicDto>.Fail(ErrorType.Validation, InvalidTitle,
                "Không thể tạo đường dẫn riêng cho tiêu đề này lúc này. Vui lòng thử lại.", "title");
        }

        // Bài đã lưu nên không cần bản nháp tự động của bài mới nữa.
        await draftRepository.DeleteForTargetAsync(authorId, null, cancellationToken);
        return Result<OwnTopicDto>.Success(MapSavedTopic(topic, values));
    }

    public async Task<Result<OwnTopicDto>> UpdateAsync(
        Guid id,
        string authorId,
        UpdateTopicRequest request,
        CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetOwnedByIdAsync(id, authorId, cancellationToken);
        if (topic is null)
        {
            return Result<OwnTopicDto>.Fail(ErrorType.NotFound, NotFoundTitle, NotFoundMessage);
        }

        // Chuyển về bản nháp sẽ ẩn cả bài lẫn câu trả lời của người khác. Bài có câu trả lời công khai thì tác giả
        // không xóa được, nên cũng không được ẩn theo cách này.
        var wouldBecomeDraft = topic.Status == TopicStatus.Published && !request.Publish;
        if (wouldBecomeDraft && await topicRepository.HasPublicAnswersAsync(topic.Id, cancellationToken))
        {
            return Result<OwnTopicDto>.Fail(ErrorType.Conflict, "Không thể lưu thành bản nháp", 
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

        // Xuất bản một bản nháp cũng tính như đăng bài mới.
        if (request.Publish && topic.Status != TopicStatus.Published &&
            !postingRateLimiter.TryAcquireTopic(authorId, out var retryAfter))
        {
            return PostingTooFast(retryAfter, "xuất bản bài tiếp");
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
        return Result<OwnTopicDto>.Success(MapSavedTopic(topic, values));
    }

    public async Task<Result> SoftDeleteAsync(
        Guid id,
        string authorId,
        CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetOwnedByIdAsync(id, authorId, cancellationToken);
        if (topic is null)
        {
            return Result.Fail(ErrorType.NotFound, NotFoundTitle, NotFoundMessage);
        }

        if (await topicRepository.HasPublicAnswersAsync(id, cancellationToken))
        {
            return Result.Fail(ErrorType.Conflict, "Không thể xóa nội dung",
                "Nội dung đã có câu trả lời công khai. Bạn có thể giữ nguyên hoặc liên hệ quản trị viên khi cần xử lý.");
        }

        topic.IsDeleted = true;
        topic.UpdatedAtUtc = timeProvider.GetUtcNow();
        // Bài đã xóa không khôi phục được, nên ảnh và video của nó thành tệp mồ côi;
        // MediaCleanupBackgroundService sẽ xóa chúng trên Cloudinary ở lần chạy tiếp theo.
        topic.MediaAssets.Clear();
        await topicRepository.SaveChangesAsync(cancellationToken);
        await draftRepository.DeleteForTargetAsync(authorId, id, cancellationToken);
        return Result.Success();
    }

    private static Result<OwnTopicDto> PostingTooFast(TimeSpan retryAfter, string action)
    {
        var seconds = MemberRateLimit.ToSeconds(retryAfter);
        return Result<OwnTopicDto>.TooManyRequests("Bạn đăng bài quá nhanh", $"Vui lòng chờ {MemberRateLimit.FormatWait(seconds)} rồi {action}.", seconds);
    }

    private sealed record TopicForm(
        string? Title,
        string? Summary,
        string? Type,
        string? BodyHtml,
        Guid CategoryId,
        IReadOnlyList<Guid>? TagIds,
        IReadOnlyList<Guid>? MediaIds);

    private sealed record ValidatedTopic(
        string Title,
        string Summary,
        TopicType Type,
        string SanitizedBody,
        Category Category,
        IReadOnlyList<Tag> Tags,
        Guid[] TagIds,
        Guid[] MediaIds,
        IReadOnlyList<MediaAsset> MediaAssets);

    private sealed class TopicValidation
    {
        private readonly ValidatedTopic? values;
        private readonly Result<OwnTopicDto>? error;

        private TopicValidation(ValidatedTopic? values, Result<OwnTopicDto>? error)
        {
            this.values = values;
            this.error = error;
        }

        [MemberNotNullWhen(true, nameof(Values))]
        [MemberNotNullWhen(false, nameof(Error))]
        public bool IsValid => values is not null;

        public ValidatedTopic? Values => values;

        public Result<OwnTopicDto>? Error => error;

        public static TopicValidation Valid(ValidatedTopic values) => new(values, null);

        public static TopicValidation Invalid(string field, string message)
        {
            return new(null, Result<OwnTopicDto>.Fail(ErrorType.Validation, InvalidTitle, message, field));
        }
    }

    // Các bước kiểm tra chạy theo thứ tự cố định và báo lỗi đầu tiên gặp.
    private async Task<TopicValidation> ValidateFormAsync(
        TopicForm form,
        string authorId,
        Guid? editingTopicId,
        CancellationToken cancellationToken)
    {
        var title = form.Title?.Trim();
        if (string.IsNullOrWhiteSpace(title) || title.Length < 10 || title.Length > 200)
        {
            return TopicValidation.Invalid("title", "Tiêu đề phải có từ 10 đến 200 ký tự.");
        }

        var summary = form.Summary?.Trim();
        if (string.IsNullOrWhiteSpace(summary) || summary.Length < 20 || summary.Length > 500)
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
        if (tagIds.Length > 5 || tagIds.Any(tagId => tagId == Guid.Empty))
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

        // Bài mới chỉ dùng được tệp chưa gắn vào đâu; bài đang sửa thì được giữ cả tệp nó đã có.
        var mediaAssets = editingTopicId.HasValue
            ? await mediaAssetRepository.GetOwnedAvailableForTopicByIdsAsync(mediaIds, authorId, editingTopicId.Value, cancellationToken)
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

    private static OwnTopicDto MapSavedTopic(Topic topic, ValidatedTopic values)
    {
        return new(
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
    }

    // Hai yêu cầu cùng tiêu đề có thể cùng thấy một slug còn trống; DB chỉ nhận một, yêu cầu kia chọn slug khác
    // rồi lưu lại. Lần trùng đầu lấy số kế tiếp; nếu vẫn trùng thì thêm một đoạn ngẫu nhiên, vì nhiều yêu cầu dồn
    // dập sẽ lại cùng chọn một số.
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

    private static TopicSummaryDto MapSummary(Topic topic, DateTimeOffset now)
    {
        return new(
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
            CoverImageUrl: topic.CoverImageUrl,
            Score: ReputationRules.ShownScore(topic.Score, IsScoreHidden(topic, now)),
            ScoreHidden: IsScoreHidden(topic, now));
    }

    private static bool IsScoreHidden(Topic topic, DateTimeOffset now)
    {
        return topic.PublishedAtUtc.HasValue && ReputationRules.IsScoreHidden(topic.PublishedAtUtc.Value, now);
    }

    private static TopicDetailDto MapDetail(Topic topic, DateTimeOffset now)
    {
        return new(
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
            ReputationRules.ShownScore(topic.Score, IsScoreHidden(topic, now)),
            IsScoreHidden(topic, now));
    }

    private static OwnTopicSummaryDto MapOwnedSummary(Topic topic)
    {
        return new(
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
    }

    private static OwnTopicDto MapOwnTopic(Topic topic)
    {
        return new(
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
    }

    private static TopicMediaDto MapMedia(MediaAsset mediaAsset)
    {
        return new(mediaAsset.Id, mediaAsset.PublicUrl, mediaAsset.ContentType);
    }

    // "article" hoặc "question", như frontend dùng.
    private static string MapType(TopicType type) => type.ToString().ToLowerInvariant();

    private static TopicCategoryDto MapCategory(Topic topic)
    {
        return new(topic.Category.Id, topic.Category.Name, topic.Category.Slug);
    }

    private static TopicAuthorDto MapAuthor(Topic topic)
    {
        return new(topic.Author.Id, topic.Author.DisplayName);
    }

    private static IReadOnlyList<TopicTagDto> MapTags(Topic topic)
    {
        return topic.TopicTags
            .Where(item => item.Tag.IsActive)
            .OrderBy(item => item.Tag.Name)
            .ThenBy(item => item.TagId)
            .Select(item => new TopicTagDto(item.TagId, item.Tag.Name, item.Tag.Slug))
            .ToList();
    }
}
