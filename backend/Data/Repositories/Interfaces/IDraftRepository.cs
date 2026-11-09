using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IDraftRepository
{
    // The draft of a member for a new topic (topicId is null) or for the topic that is being edited.
    Task<Draft?> GetForTargetAsync(string userId, int? topicId, CancellationToken cancellationToken);

    // True when the topic exists, is not deleted and was written by this member.
    Task<bool> OwnsTopicAsync(string userId, int topicId, CancellationToken cancellationToken);

    // False when another request saved the first draft of the same target a moment before (the database allows
    // only one draft for each member and target). The caller then reads that draft and updates it.
    Task<bool> TryAddAsync(Draft draft, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);

    // Removes that draft when it exists. Nothing happens when it does not.
    Task DeleteForTargetAsync(string userId, int? topicId, CancellationToken cancellationToken);
}
