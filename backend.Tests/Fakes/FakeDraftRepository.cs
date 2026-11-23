using TechForum.Api.Data.Repositories;
using TechForum.Api.Models;

namespace TechForum.Api.Tests.Fakes;

public sealed class FakeDraftRepository : IDraftRepository
{
    public List<Draft> Drafts { get; } = [];

    // (id thành viên, id bài) mà thành viên đó là tác giả.
    public HashSet<(string UserId, Guid TopicId)> OwnedTopics { get; } = [];

    public List<(string UserId, Guid? TopicId)> DeletedTargets { get; } = [];

    public int SaveCount { get; private set; }

    public Task<Draft?> GetForTargetAsync(string userId, Guid? topicId, CancellationToken cancellationToken) =>
        Task.FromResult(Drafts.SingleOrDefault(draft => draft.UserId == userId && draft.TopicId == topicId));

    public Task<bool> OwnsTopicAsync(string userId, Guid topicId, CancellationToken cancellationToken) =>
        Task.FromResult(OwnedTopics.Contains((userId, topicId)));

    // Giả lập yêu cầu khác vừa tạo bản nháp đầu tiên của cùng đích: bản nháp được thêm vào và lệnh thêm của nơi gọi bị từ chối.
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
