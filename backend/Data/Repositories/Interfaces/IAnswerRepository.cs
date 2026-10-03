using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IAnswerRepository
{
    Task<AnswerPage> GetPublicPageAsync(
        int topicId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task AddAsync(Answer answer, CancellationToken cancellationToken);

    Task<Answer?> GetVisibleByIdAsync(
        int topicId,
        int answerId,
        CancellationToken cancellationToken);

    Task<Answer?> GetOwnedByIdAsync(
        int topicId,
        int answerId,
        string authorId,
        CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
