using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class AdminTopicService : IAdminTopicService
{
    private static readonly Dictionary<string, string> ActionDescriptions = new()
    {
        ["hide"] = "bị ẩn",
        ["restore"] = "được khôi phục",
        ["lock"] = "bị khóa thảo luận",
        ["unlock"] = "được mở thảo luận"
    };

    private static readonly HashSet<string> Actions = new(StringComparer.OrdinalIgnoreCase)
    { "hide", "restore", "lock", "unlock", "pin", "unpin", "move" };

    private readonly IAdminTopicRepository topicRepository;
    private readonly IContentSanitizer contentSanitizer;
    private readonly TimeProvider timeProvider;

    public AdminTopicService(
        IAdminTopicRepository topicRepository,
        IContentSanitizer contentSanitizer,
        TimeProvider timeProvider)
    {
        this.topicRepository = topicRepository;
        this.contentSanitizer = contentSanitizer;
        this.timeProvider = timeProvider;
    }

    public async Task<AdminTopicDetailDto?> GetByIdAsync(Guid topicId, CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetTrackedByIdAsync(topicId, cancellationToken);
        return topic is null ? null : new AdminTopicDetailDto(Map(topic), contentSanitizer.Sanitize(topic.BodyHtml));
    }

    public async Task<PagedResultDto<AdminTopicDto>> GetPageAsync(
        AdminTopicQuery query,
        CancellationToken cancellationToken)
    {
        // Bộ lọc đã được kiểm tra ở AdminTopicQuery; để trống thì lấy mọi loại.
        TopicType? type = null;
        if (Enum.TryParse<TopicType>(query.Type?.Trim(), true, out var parsedType))
        {
            type = parsedType;
        }

        var page = await topicRepository.GetPageAsync(query, type, cancellationToken);
        return new PagedResultDto<AdminTopicDto>(
            page.Items.Select(Map).ToList(), query.Page, query.PageSize, page.TotalItems,
            (int)Math.Ceiling(page.TotalItems / (double)query.PageSize));
    }

    public async Task<Result<AdminTopicDto>> ModerateAsync(
        Guid topicId,
        string administratorId,
        ModerateTopicRequest request,
        CancellationToken cancellationToken)
    {
        var action = request.Action?.Trim().ToLowerInvariant();
        if (action is null || !Actions.Contains(action))
        {
            return Result<AdminTopicDto>.Fail(ErrorType.Validation, null, "Hành động kiểm duyệt không hợp lệ.", "action");
        }
        var reason = request.Reason?.Trim();
        if (string.IsNullOrWhiteSpace(reason) || reason.Length > 1000)
        {
            return Result<AdminTopicDto>.Fail(ErrorType.Validation, null, "Lý do phải có từ 1 đến 1.000 ký tự.", "reason");
        }
        var topic = await topicRepository.GetTrackedByIdAsync(topicId, cancellationToken);
        if (topic is null)
        {
            return Result<AdminTopicDto>.Fail(ErrorType.NotFound, "Không tìm thấy nội dung", "Không tìm thấy nội dung.");
        }
        if (topic.IsDeleted && action != "lock" && action != "unlock")
        {
            return Result<AdminTopicDto>.Fail(ErrorType.Conflict, "Không thể kiểm duyệt", "Nội dung đã bị tác giả xóa và không thể thực hiện hành động này.");
        }

        var previousValue = Describe(topic);
        switch (action)
        {
            // Đây là quyết định của quản trị viên nên không còn là "tự ẩn vì báo cáo".
            case "hide": topic.IsHiddenByModerator = true; topic.AutoHiddenAtUtc = null; break;
            case "restore": topic.IsHiddenByModerator = false; topic.AutoHiddenAtUtc = null; break;
            case "lock": topic.IsDiscussionLocked = true; break;
            case "unlock": topic.IsDiscussionLocked = false; break;
            case "pin": topic.IsPinned = true; break;
            case "unpin": topic.IsPinned = false; break;
            case "move":
                if (!request.CategoryId.HasValue)
                {
                    return Result<AdminTopicDto>.Fail(ErrorType.Validation, null, "Vui lòng chọn chuyên mục đích.", "categoryId");
                }
                var category = await topicRepository.GetActiveCategoryAsync(request.CategoryId.Value, cancellationToken);
                if (category is null)
                {
                    return Result<AdminTopicDto>.Fail(ErrorType.Validation, null, "Chuyên mục đích không tồn tại hoặc đã ngừng sử dụng.", "categoryId");
                }
                topic.CategoryId = category.Id;
                topic.Category = category;
                break;
        }

        if (previousValue == Describe(topic))
        {
            return Result<AdminTopicDto>.Success(Map(topic));
        }
        var now = timeProvider.GetUtcNow();
        topic.UpdatedAtUtc = now;
        // Ghim, bỏ ghim và chuyển chuyên mục không cần báo cho tác giả.
        ActionDescriptions.TryGetValue(action, out var actionDescription);
        Notification? notification = actionDescription is null ? null : new Notification
        {
            UserId = topic.AuthorId,
            Type = "content-moderated",
            Title = "Kết quả kiểm duyệt nội dung",
            Message = $"Nội dung “{topic.Title}” đã {actionDescription}. Lý do: {reason}",
            Link = "/notifications",
            SourceKey = $"topic-moderated:{Guid.NewGuid():N}",
            CreatedAtUtc = now
        };
        var saved = await topicRepository.SaveWithAuditAsync(new AdminAuditLog
        {
            AdministratorId = administratorId,
            Action = $"topic.{action}",
            TargetType = "topic",
            TargetId = topic.Id.ToString(),
            PreviousValue = previousValue,
            NewValue = Describe(topic),
            Reason = reason,
            CreatedAtUtc = now
        }, notification, cancellationToken);
        if (!saved)
        {
            return Result<AdminTopicDto>.Fail(ErrorType.Conflict, "Không thể kiểm duyệt", "Nội dung vừa được cập nhật bởi người khác. Vui lòng tải lại trước khi kiểm duyệt.");
        }
        return Result<AdminTopicDto>.Success(Map(topic));
    }

    private static string Describe(Topic topic)
    {
        return $"hidden={topic.IsHiddenByModerator};locked={topic.IsDiscussionLocked};pinned={topic.IsPinned};categoryId={topic.CategoryId};deleted={topic.IsDeleted}";
    }

    private static AdminTopicDto Map(Topic topic)
    {
        return new(
            topic.Id, topic.Title, topic.Type == TopicType.Article ? "article" : "question",
            new TopicCategoryDto(topic.Category.Id, topic.Category.Name, topic.Category.Slug),
            new TopicAuthorDto(topic.Author.Id, topic.Author.DisplayName),
            topic.Status == TopicStatus.Published ? "published" : "draft",
            topic.CreatedAtUtc, topic.PublishedAtUtc, topic.IsDeleted, topic.IsHiddenByModerator,
            topic.IsDiscussionLocked, topic.IsPinned);
    }
}
