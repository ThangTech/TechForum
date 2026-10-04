using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class NotificationService(
    INotificationRepository notificationRepository,
    TimeProvider timeProvider) : INotificationService
{
    public async Task<NotificationPageDto> GetPageAsync(
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var result = await notificationRepository.GetPageAsync(userId, page, pageSize, cancellationToken);
        var totalPages = result.TotalItems == 0
            ? 0
            : (int)Math.Ceiling(result.TotalItems / (double)pageSize);
        return new NotificationPageDto(
            result.Items.Select(Map).ToList(),
            page,
            pageSize,
            result.TotalItems,
            totalPages,
            result.UnreadCount);
    }

    public Task AddAcceptedAnswerAsync(
        string recipientId,
        int topicId,
        int answerId,
        string topicTitle,
        CancellationToken cancellationToken) =>
        notificationRepository.AddIfMissingAsync(new Notification
        {
            UserId = recipientId,
            Type = "accepted-answer",
            Title = "Câu trả lời được chấp nhận",
            Message = $"Câu trả lời của bạn trong “{topicTitle}” đã được chấp nhận.",
            Link = $"/topics/{topicId}#answer-{answerId}",
            SourceKey = $"accepted-answer:{topicId}:{answerId}",
            CreatedAtUtc = timeProvider.GetUtcNow()
        }, cancellationToken);

    public async Task AddNewAnswerAsync(
        string recipientId,
        int topicId,
        int answerId,
        string answerAuthorName,
        string topicTitle,
        CancellationToken cancellationToken)
    {
        var added = await notificationRepository.AddIfMissingAsync(new Notification
        {
            UserId = recipientId,
            Type = "new-answer",
            Title = "Câu trả lời mới",
            Message = $"{answerAuthorName} đã trả lời trong “{topicTitle}”.",
            Link = $"/topics/{topicId}#answer-{answerId}",
            SourceKey = $"new-answer:{topicId}:{answerId}",
            CreatedAtUtc = timeProvider.GetUtcNow()
        }, cancellationToken);

        if (added)
        {
            await notificationRepository.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<bool> MarkReadAsync(
        long id,
        string userId,
        CancellationToken cancellationToken)
    {
        var notification = await notificationRepository.GetUnreadAsync(id, userId, cancellationToken);
        if (notification is null) return false;
        notification.ReadAtUtc = timeProvider.GetUtcNow();
        await notificationRepository.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static NotificationDto Map(Notification notification) => new(
        notification.Id,
        notification.Type,
        notification.Title,
        notification.Message,
        notification.Link,
        notification.CreatedAtUtc,
        notification.ReadAtUtc);
}
