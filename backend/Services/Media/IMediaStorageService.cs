using TechForum.Api.Dtos;
namespace TechForum.Api.Services;

public interface IMediaStorageService
{
    Task<Result<MediaUploadDto>> StoreImageAsync(
        string uploaderId,
        IFormFile file,
        CancellationToken cancellationToken);

    Task<Result<MediaUploadDto>> StoreVideoAsync(
        string uploaderId,
        IFormFile file,
        CancellationToken cancellationToken);

    Task<Result> DeleteUnusedAsync(
        string uploaderId,
        Guid id,
        CancellationToken cancellationToken);

    Task<int> CleanupOrphansAsync(CancellationToken cancellationToken);
}
