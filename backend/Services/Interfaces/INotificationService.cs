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
        int topicId,
        int answerId,
        string topicTitle,
        CancellationToken cancellationToken);

    Task AddNewAnswerAsync(
        string recipientId,
        int topicId,
        int answerId,
        string answerAuthorName,
        string topicTitle,
        CancellationToken cancellationToken);

    Task<bool> MarkReadAsync(
        long id,
        string userId,
        CancellationToken cancellationToken);
}
