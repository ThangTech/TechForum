using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IDraftService
{
    // The draft of the member for a new topic (topicId is null) or for the topic that is being edited.
    Task<DraftDto?> GetAsync(string userId, Guid? topicId, CancellationToken cancellationToken);

    // Inserts the draft when the member has none for that target, and replaces it when there is one.
    Task<DraftWriteResult> SaveAsync(string userId, SaveDraftRequest request, CancellationToken cancellationToken);

    Task DeleteAsync(string userId, Guid? topicId, CancellationToken cancellationToken);
}
