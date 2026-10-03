using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IMediaAssetRepository
{
    Task AddAsync(MediaAsset mediaAsset, CancellationToken cancellationToken);

    Task<MediaAsset?> GetOwnedAsync(
        Guid id,
        string uploaderId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaAsset>> GetOrphansOlderThanAsync(
        DateTimeOffset threshold,
        int take,
        CancellationToken cancellationToken);

    Task DeleteAsync(MediaAsset mediaAsset, CancellationToken cancellationToken);
}
