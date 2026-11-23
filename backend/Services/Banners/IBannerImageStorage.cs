namespace TechForum.Api.Services;

public interface IBannerImageStorage
{
    Task<Result<string>> SaveAsync(IFormFile file, CancellationToken cancellationToken);

    bool IsStoredImageUrl(string imageUrl);

    Task DeleteAsync(string imageUrl, CancellationToken cancellationToken);
}
