using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface INotificationService
{
    Task<NotificationPageDto> GetPageAsync(
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task AddAcceptedAnswerAsync(
        string recipientId,
        Guid topicId,
        Guid answerId,
        string topicTitle,
        CancellationToken cancellationToken);

    Task AddNewAnswerAsync(
        string recipientId,
        Guid topicId,
        Guid answerId,
        string answerAuthorName,
        string topicTitle,
        CancellationToken cancellationToken);

    Task<bool> MarkReadAsync(
        Guid id,
        string userId,
        CancellationToken cancellationToken);
}
