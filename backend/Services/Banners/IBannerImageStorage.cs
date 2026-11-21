namespace TechForum.Api.Services;

// Keeps the picture files of the banners in the Cloudinary account (folder "banners").
public interface IBannerImageStorage
{
    Task<BannerImageResult> SaveAsync(IFormFile file, CancellationToken cancellationToken);

    // True when the address points to a file that this storage handed out (also an old file of the disk).
    bool IsStoredImageUrl(string imageUrl);

    // Removes the file of a picture that is not used any more. An unknown address is ignored.
    Task DeleteAsync(string imageUrl, CancellationToken cancellationToken);
}
