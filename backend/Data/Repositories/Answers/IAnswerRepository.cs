using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IAnswerRepository
{
    Task<AnswerPage?> GetPublicPageAsync(
        Guid topicId,
        int page,
        int pageSize,
        Guid? aroundAnswerId,
        string sort,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<AnswerVoteState>> GetVoteStatesAsync(
        IReadOnlyCollection<Guid> answerIds,
        string? viewerId,
        CancellationToken cancellationToken);

    Task AdjustReputationAsync(string userId, int delta, CancellationToken cancellationToken);

    Task AddAsync(Answer answer, CancellationToken cancellationToken);

    Task<Answer?> GetVisibleByIdAsync(
        Guid topicId,
        Guid answerId,
        CancellationToken cancellationToken);

    Task<Answer?> GetOwnedByIdAsync(
        Guid topicId,
        Guid answerId,
        string authorId,
        CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
