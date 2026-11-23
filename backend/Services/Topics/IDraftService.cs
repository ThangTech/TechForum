using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IDraftService
{
    Task<DraftDto?> GetAsync(string userId, Guid? topicId, CancellationToken cancellationToken);

    Task<Result<DraftDto>> SaveAsync(string userId, SaveDraftRequest request, CancellationToken cancellationToken);

    Task DeleteAsync(string userId, Guid? topicId, CancellationToken cancellationToken);
}
