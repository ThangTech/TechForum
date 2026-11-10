using TechForum.Api.Data.Repositories;
using TechForum.Api.Models;

namespace TechForum.Api.Tests.Fakes;

// In-memory stand-in for the draft table, shared by the draft and topic tests.
public sealed class FakeDraftRepository : IDraftRepository
{
    public List<Draft> Drafts { get; } = [];

    // The topics that count as written by a member: (member id, topic id).
    public HashSet<(string UserId, Guid TopicId)> OwnedTopics { get; } = [];

    // Every call of DeleteForTargetAsync, in order, so a test can see which draft was removed.
    public List<(string UserId, Guid? TopicId)> DeletedTargets { get; } = [];

    public int SaveCount { get; private set; }

    public Task<Draft?> GetForTargetAsync(string userId, Guid? topicId, CancellationToken cancellationToken) =>
        Task.FromResult(Drafts.SingleOrDefault(draft => draft.UserId == userId && draft.TopicId == topicId));

    public Task<bool> OwnsTopicAsync(string userId, Guid topicId, CancellationToken cancellationToken) =>
        Task.FromResult(OwnedTopics.Contains((userId, topicId)));

    // Set to a draft to act like another request that created the first draft of the same target a moment before:
    // the draft is added to the list and the insert of the caller is refused.
    public Draft? DraftCreatedByAnotherRequest { get; set; }

    public Task<bool> TryAddAsync(Draft draft, CancellationToken cancellationToken)
    {
        if (DraftCreatedByAnotherRequest is { } other)
        {
            Drafts.Add(other);
            DraftCreatedByAnotherRequest = null;
            return Task.FromResult(false);
        }

        Drafts.Add(draft);
        return Task.FromResult(true);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        SaveCount++;
        return Task.CompletedTask;
    }

    public Task DeleteForTargetAsync(string userId, Guid? topicId, CancellationToken cancellationToken)
    {
        DeletedTargets.Add((userId, topicId));
        Drafts.RemoveAll(draft => draft.UserId == userId && draft.TopicId == topicId);
        return Task.CompletedTask;
    }
}
