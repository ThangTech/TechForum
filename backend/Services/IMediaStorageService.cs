namespace TechForum.Api.Services;

public interface IMediaStorageService
{
    Task<MediaUploadResult> StoreImageAsync(
        string uploaderId,
        IFormFile file,
        CancellationToken cancellationToken);

    Task<MediaUploadResult> StoreVideoAsync(
        string uploaderId,
        IFormFile file,
        CancellationToken cancellationToken);

    Task<MediaDeleteResult> DeleteUnusedAsync(
        string uploaderId,
        Guid id,
        CancellationToken cancellationToken);

    Task<int> CleanupOrphansAsync(CancellationToken cancellationToken);
}
