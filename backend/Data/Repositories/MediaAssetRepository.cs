using Microsoft.EntityFrameworkCore;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class MediaAssetRepository(TechForumDbContext dbContext) : IMediaAssetRepository
{
    public async Task AddAsync(MediaAsset mediaAsset, CancellationToken cancellationToken)
    {
        dbContext.MediaAssets.Add(mediaAsset);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task<MediaAsset?> GetOwnedAsync(
        Guid id,
        string uploaderId,
        CancellationToken cancellationToken) =>
        dbContext.MediaAssets.SingleOrDefaultAsync(
            item => item.Id == id && item.UploaderId == uploaderId,
            cancellationToken);

    public async Task<IReadOnlyList<MediaAsset>> GetOwnedUnattachedByIdsAsync(
        IReadOnlyCollection<Guid> ids,
        string uploaderId,
        CancellationToken cancellationToken) =>
        await dbContext.MediaAssets
            .Where(item =>
                ids.Contains(item.Id) &&
                item.UploaderId == uploaderId &&
                item.TopicId == null)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<MediaAsset>> GetOwnedAvailableForTopicByIdsAsync(
        IReadOnlyCollection<Guid> ids,
        string uploaderId,
        int topicId,
        CancellationToken cancellationToken) =>
        await dbContext.MediaAssets
            .Where(item =>
                ids.Contains(item.Id) &&
                item.UploaderId == uploaderId &&
                (item.TopicId == null || item.TopicId == topicId))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<MediaAsset>> GetOrphansOlderThanAsync(
        DateTimeOffset threshold,
        int take,
        CancellationToken cancellationToken) =>
        await dbContext.MediaAssets
            // A picture that a draft still uses is not an orphan: the member may come back to the draft later.
            .Where(item => item.TopicId == null && item.CreatedAtUtc < threshold &&
                !dbContext.Drafts.Any(draft => draft.MediaIds.Contains(item.Id)))
            .OrderBy(item => item.CreatedAtUtc)
            .Take(take)
            .ToListAsync(cancellationToken);

    public async Task DeleteAsync(MediaAsset mediaAsset, CancellationToken cancellationToken)
    {
        dbContext.MediaAssets.Remove(mediaAsset);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
