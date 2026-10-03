using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class AdminTopicService(
    IAdminTopicRepository topicRepository,
    TimeProvider timeProvider) : IAdminTopicService
{
    private static readonly HashSet<string> Actions = new(StringComparer.OrdinalIgnoreCase)
    { "hide", "restore", "lock", "unlock", "pin", "unpin", "move" };

    public async Task<PagedResultDto<AdminTopicDto>?> GetPageAsync(
        AdminTopicQuery query,
        CancellationToken cancellationToken)
    {
        if (query.Page < 1 || query.PageSize is < 1 or > 50 || query.Keyword?.Trim().Length > 100 || query.CategoryId is <= 0)
            return null;
        TopicType? type = query.Type?.Trim().ToLowerInvariant() switch
        {
            null or "" => null,
            "article" => TopicType.Article,
            "question" => TopicType.Question,
            _ => (TopicType?)null
        };
        if (!string.IsNullOrWhiteSpace(query.Type) && !type.HasValue) return null;
        var visibility = query.Visibility?.Trim().ToLowerInvariant();
        if (visibility is not (null or "" or "visible" or "hidden" or "deleted")) return null;

        var page = await topicRepository.GetPageAsync(query, type, cancellationToken);
        return new PagedResultDto<AdminTopicDto>(
            page.Items.Select(Map).ToList(), query.Page, query.PageSize, page.TotalItems,
            (int)Math.Ceiling(page.TotalItems / (double)query.PageSize));
    }

    public async Task<AdminTopicWriteResult> ModerateAsync(
        int topicId,
        string administratorId,
        ModerateTopicRequest request,
        CancellationToken cancellationToken)
    {
        var action = request.Action?.Trim().ToLowerInvariant();
        if (action is null || !Actions.Contains(action))
            return AdminTopicWriteResult.Failed(AdminTopicWriteFailure.Validation, "Hành động kiểm duyệt không hợp lệ.", "action");
        var reason = request.Reason?.Trim();
        if (string.IsNullOrWhiteSpace(reason) || reason.Length > 1000)
            return AdminTopicWriteResult.Failed(AdminTopicWriteFailure.Validation, "Lý do phải có từ 1 đến 1.000 ký tự.", "reason");
        var topic = await topicRepository.GetTrackedByIdAsync(topicId, cancellationToken);
        if (topic is null) return AdminTopicWriteResult.Failed(AdminTopicWriteFailure.NotFound, "Không tìm thấy nội dung.");
        if (topic.IsDeleted && action is not ("lock" or "unlock"))
            return AdminTopicWriteResult.Failed(AdminTopicWriteFailure.Conflict, "Nội dung đã bị tác giả xóa và không thể thực hiện hành động này.");

        var previousValue = Describe(topic);
        switch (action)
        {
            case "hide": topic.IsHiddenByModerator = true; break;
            case "restore": topic.IsHiddenByModerator = false; break;
            case "lock": topic.IsDiscussionLocked = true; break;
            case "unlock": topic.IsDiscussionLocked = false; break;
            case "pin": topic.IsPinned = true; break;
            case "unpin": topic.IsPinned = false; break;
            case "move":
                if (!request.CategoryId.HasValue)
                    return AdminTopicWriteResult.Failed(AdminTopicWriteFailure.Validation, "Vui lòng chọn chuyên mục đích.", "categoryId");
                var category = await topicRepository.GetActiveCategoryAsync(request.CategoryId.Value, cancellationToken);
                if (category is null)
                    return AdminTopicWriteResult.Failed(AdminTopicWriteFailure.Validation, "Chuyên mục đích không tồn tại hoặc đã ngừng sử dụng.", "categoryId");
                topic.CategoryId = category.Id;
                topic.Category = category;
                break;
        }

        topic.UpdatedAtUtc = timeProvider.GetUtcNow();
        await topicRepository.SaveWithAuditAsync(new AdminAuditLog
        {
            AdministratorId = administratorId,
            Action = $"topic.{action}",
            TargetType = "topic",
            TargetId = topic.Id.ToString(),
            PreviousValue = previousValue,
            NewValue = Describe(topic),
            Reason = reason,
            CreatedAtUtc = timeProvider.GetUtcNow()
        }, cancellationToken);
        return AdminTopicWriteResult.Success(Map(topic));
    }

    private static string Describe(Topic topic) =>
        $"hidden={topic.IsHiddenByModerator};locked={topic.IsDiscussionLocked};pinned={topic.IsPinned};categoryId={topic.CategoryId}";

    private static AdminTopicDto Map(Topic topic) => new(
        topic.Id, topic.Title, topic.Type == TopicType.Article ? "article" : "question",
        new TopicCategoryDto(topic.Category.Id, topic.Category.Name, topic.Category.Slug),
        new TopicAuthorDto(topic.Author.Id, topic.Author.DisplayName),
        topic.Status == TopicStatus.Published ? "published" : "draft",
        topic.CreatedAtUtc, topic.PublishedAtUtc, topic.IsDeleted, topic.IsHiddenByModerator,
        topic.IsDiscussionLocked, topic.IsPinned);
}
