namespace TechForum.Api.Services;

public interface IMediaStorageService
{
    Task<MediaUploadResult> StoreImageAsync(IFormFile file, CancellationToken cancellationToken);
    Task<MediaUploadResult> StoreVideoAsync(IFormFile file, CancellationToken cancellationToken);
}
