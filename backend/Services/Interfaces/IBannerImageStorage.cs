namespace TechForum.Api.Services;

// Keeps the picture files of the banners on the disk, in the "banners" folder of the media storage.
public interface IBannerImageStorage
{
    Task<BannerImageResult> SaveAsync(IFormFile file, CancellationToken cancellationToken);

    // True when the address points to a file that this storage handed out.
    bool IsStoredImageUrl(string imageUrl);

    // Removes the file of a picture that is not used any more. An unknown address is ignored.
    void Delete(string imageUrl);
}
