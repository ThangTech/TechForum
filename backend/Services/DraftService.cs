using System.Net;
using System.Text.RegularExpressions;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed partial class DraftService(
    IDraftRepository draftRepository,
    IMediaAssetRepository mediaAssetRepository,
    IContentSanitizer contentSanitizer,
    TimeProvider timeProvider) : IDraftService
{
    private const int MaxTitleLength = 200;
    private const int MaxSummaryLength = 500;
    private const int MaxBodyLength = 100_000;
    private const int MaxTagCount = 5;
    private const int MaxMediaCount = 20;

    public async Task<DraftDto?> GetAsync(string userId, int? topicId, CancellationToken cancellationToken)
    {
        var draft = await draftRepository.GetForTargetAsync(userId, topicId, cancellationToken);
        if (draft is null)
        {
            return null;
        }

        var media = await GetUsableMediaAsync(userId, topicId, draft.MediaIds, cancellationToken);
        return Map(draft, media);
    }

    public async Task<DraftWriteResult> SaveAsync(
        string userId,
        SaveDraftRequest request,
        CancellationToken cancellationToken)
    {
        var title = request.Title?.Trim() ?? string.Empty;
        if (title.Length > MaxTitleLength)
        {
            return Invalid("title", $"Tiêu đề không được vượt quá {MaxTitleLength} ký tự.");
        }

        var summary = request.Summary?.Trim() ?? string.Empty;
        if (summary.Length > MaxSummaryLength)
        {
            return Invalid("summary", $"Tóm tắt không được vượt quá {MaxSummaryLength} ký tự.");
        }

        var type = TopicType.Article;
        if (!string.IsNullOrWhiteSpace(request.Type) && !TryParseType(request.Type, out type))
        {
            return Invalid("type", "Loại nội dung phải là 'article' hoặc 'question'.");
        }

        var rawBody = request.BodyHtml ?? string.Empty;
        if (rawBody.Length > MaxBodyLength)
        {
            return Invalid("bodyHtml", $"Nội dung không được vượt quá {MaxBodyLength:N0} ký tự.");
        }

        // The same cleaning as a topic, so a draft never holds HTML that a topic could not hold.
        var body = contentSanitizer.Sanitize(rawBody).Trim();
        if (title.Length == 0 && summary.Length == 0 && !HasContent(body))
        {
            return Invalid("bodyHtml", "Chưa có nội dung nào để lưu bản nháp.");
        }

        var tagIds = (request.TagIds ?? []).Distinct().ToList();
        if (tagIds.Count > MaxTagCount || tagIds.Any(tagId => tagId <= 0))
        {
            return Invalid("tagIds", $"Chỉ được chọn tối đa {MaxTagCount} thẻ hợp lệ.");
        }

        var requestedMediaIds = (request.MediaIds ?? []).Distinct().ToList();
        if (requestedMediaIds.Count > MaxMediaCount || requestedMediaIds.Any(mediaId => mediaId == Guid.Empty))
        {
            return Invalid("mediaIds", $"Chỉ được dùng tối đa {MaxMediaCount} media hợp lệ trong một nội dung.");
        }

        // A draft of an edited topic can only belong to a topic of the same member.
        if (request.TopicId is { } topicId &&
            !await draftRepository.OwnsTopicAsync(userId, topicId, cancellationToken))
        {
            return DraftWriteResult.Failed(DraftWriteFailure.NotFound, "Nội dung không tồn tại hoặc không thuộc tài khoản này.");
        }

        // Only the files of this member that are free (or already in this topic) are kept; the others are left out
        // without an error, because a draft must be saved even when one file was removed in the meantime.
        var media = await GetUsableMediaAsync(userId, request.TopicId, requestedMediaIds, cancellationToken);

        var existing = await draftRepository.GetForTargetAsync(userId, request.TopicId, cancellationToken);
        var draft = existing ?? NewDraft(userId, request.TopicId, title, summary, body);
        Fill(draft, title, summary, body, type, request.CategoryId, tagIds, media);

        if (existing is null && !await draftRepository.TryAddAsync(draft, cancellationToken))
        {
            // Another request created the first draft of this target a moment ago: replace that one.
            draft = await draftRepository.GetForTargetAsync(userId, request.TopicId, cancellationToken)
                ?? throw new InvalidOperationException("The draft that blocked the insert was not found.");
            Fill(draft, title, summary, body, type, request.CategoryId, tagIds, media);
            await draftRepository.SaveChangesAsync(cancellationToken);
        }
        else if (existing is not null)
        {
            await draftRepository.SaveChangesAsync(cancellationToken);
        }

        return DraftWriteResult.Success(Map(draft, media));
    }

    private static Draft NewDraft(string userId, int? topicId, string title, string summary, string body) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        TopicId = topicId,
        Title = title,
        Summary = summary,
        BodyHtml = body
    };

    private void Fill(
        Draft draft,
        string title,
        string summary,
        string body,
        TopicType type,
        int? categoryId,
        List<int> tagIds,
        IReadOnlyList<MediaAsset> media)
    {
        draft.Title = title;
        draft.Summary = summary;
        draft.BodyHtml = body;
        draft.Type = type;
        draft.CategoryId = categoryId is > 0 ? categoryId : null;
        draft.TagIds = tagIds;
        draft.MediaIds = media.Select(item => item.Id).ToList();
        draft.UpdatedAtUtc = timeProvider.GetUtcNow();
    }

    public Task DeleteAsync(string userId, int? topicId, CancellationToken cancellationToken) =>
        draftRepository.DeleteForTargetAsync(userId, topicId, cancellationToken);

    private async Task<IReadOnlyList<MediaAsset>> GetUsableMediaAsync(
        string userId,
        int? topicId,
        IReadOnlyCollection<Guid> mediaIds,
        CancellationToken cancellationToken)
    {
        if (mediaIds.Count == 0)
        {
            return [];
        }

        return topicId is { } id
            ? await mediaAssetRepository.GetOwnedAvailableForTopicByIdsAsync(mediaIds, userId, id, cancellationToken)
            : await mediaAssetRepository.GetOwnedUnattachedByIdsAsync(mediaIds, userId, cancellationToken);
    }

    private static DraftDto Map(Draft draft, IReadOnlyList<MediaAsset> media) => new(
        draft.Id,
        draft.TopicId,
        draft.Title,
        draft.Summary,
        draft.BodyHtml,
        draft.Type == TopicType.Question ? "question" : "article",
        draft.CategoryId,
        draft.TagIds,
        media.Select(item => new TopicMediaDto(item.Id, item.PublicUrl, item.ContentType)).ToList(),
        draft.UpdatedAtUtc);

    private static DraftWriteResult Invalid(string field, string message) =>
        DraftWriteResult.Failed(DraftWriteFailure.Validation, message, field);

    // Text, a picture or a video. The empty tags that the editor leaves (<p><br></p>) do not count.
    private static bool HasContent(string html)
    {
        var text = WebUtility.HtmlDecode(HtmlTags().Replace(html, string.Empty)).Trim();
        return text.Length > 0 || MediaTags().IsMatch(html);
    }

    private static bool TryParseType(string? value, out TopicType type)
    {
        if (string.Equals(value?.Trim(), "question", StringComparison.OrdinalIgnoreCase))
        {
            type = TopicType.Question;
            return true;
        }

        type = TopicType.Article;
        return string.Equals(value?.Trim(), "article", StringComparison.OrdinalIgnoreCase);
    }

    [GeneratedRegex("<[^>]*>")]
    private static partial Regex HtmlTags();

    [GeneratedRegex(@"<(img|video)\b", RegexOptions.IgnoreCase)]
    private static partial Regex MediaTags();
}
