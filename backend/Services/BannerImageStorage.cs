using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;

namespace TechForum.Api.Services;

// The picture of a banner is kept in the Cloudinary account (folder "banners"). The banner record keeps the address.
// A picture of the time before Cloudinary (/media/banners/...) is still accepted and is deleted from the disk.
public sealed class BannerImageStorage : IBannerImageStorage
{
    private const string FolderName = "banners";
    private static readonly byte[] PngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    private static readonly byte[] JpegSignature = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] WebPContainer = "RIFF"u8.ToArray();
    private static readonly byte[] WebPType = "WEBP"u8.ToArray();

    private readonly MediaOptions options;
    private readonly ICloudMediaClient cloud;
    private readonly MediaUrlRules rules;
    private readonly ILogger<BannerImageStorage> logger;
    // The folder and the address of the old files on the disk.
    private readonly string bannerRoot;
    private readonly string localUrlPrefix;

    public BannerImageStorage(
        IWebHostEnvironment environment,
        IOptions<MediaOptions> optionsAccessor,
        ICloudMediaClient cloud,
        MediaUrlRules rules,
        ILogger<BannerImageStorage> logger)
    {
        options = optionsAccessor.Value;
        this.cloud = cloud;
        this.rules = rules;
        this.logger = logger;
        if (Path.IsPathRooted(options.StoragePath))
        {
            throw new InvalidOperationException("Media:StoragePath phải là đường dẫn tương đối trong backend.");
        }

        var contentRoot = Path.GetFullPath(environment.ContentRootPath);
        var storageRoot = Path.GetFullPath(Path.Combine(contentRoot, options.StoragePath));
        if (!storageRoot.StartsWith(contentRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Media:StoragePath không được nằm ngoài backend.");
        }

        bannerRoot = Path.Combine(storageRoot, FolderName);
        localUrlPrefix = $"/{options.RequestPath.Trim('/')}/{FolderName}/";
    }

    public async Task<BannerImageResult> SaveAsync(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length <= 0 || file.Length > options.MaxImageBytes)
        {
            return BannerImageResult.Invalid($"Ảnh banner phải có dung lượng từ 1 byte đến {options.MaxImageBytes / 1024 / 1024} MB.");
        }

        string? extension;
        await using (var input = file.OpenReadStream())
        {
            var header = new byte[16];
            var bytesRead = await input.ReadAsync(header.AsMemory(), cancellationToken);
            extension = DetectExtension(header.AsSpan(0, bytesRead), file.ContentType);
        }

        if (extension is null)
        {
            return BannerImageResult.Invalid("Ảnh banner chỉ hỗ trợ tệp PNG, JPEG hoặc WebP hợp lệ.");
        }

        if (!cloud.IsConfigured)
        {
            return BannerImageResult.Invalid("Chưa cấu hình lưu trữ Cloudinary nên chưa thể tải ảnh banner lên.");
        }

        var id = Guid.NewGuid();
        try
        {
            await using var content = file.OpenReadStream();
            var url = await cloud.UploadAsync(
                content, $"{id:N}{extension}", CloudResourceType.Image, rules.CreatePublicId(FolderName, id), cancellationToken);
            if (rules.IsCloudBannerUrl(url))
            {
                return BannerImageResult.Success(url);
            }

            logger.LogWarning("Cloudinary trả về địa chỉ banner không đúng quy tắc: {Url}", url);
            await TryDeleteFromCloudAsync(url, cancellationToken);
            return BannerImageResult.Invalid("Cloudinary trả về địa chỉ không hợp lệ.");
        }
        catch (CloudMediaRejectedException exception)
        {
            // The connection works and Cloudinary refused the file itself: the member is told why.
            logger.LogInformation("Cloudinary từ chối ảnh banner: {Reason}", exception.CloudMessage);
            return BannerImageResult.Invalid(CloudRejection.ToMessage(exception.CloudMessage));
        }
        catch (CloudMediaException exception)
        {
            logger.LogWarning(exception, "Không tải được ảnh banner lên Cloudinary.");
            return BannerImageResult.Invalid("Không thể tải ảnh lên Cloudinary lúc này. Vui lòng thử lại.");
        }
    }

    public bool IsStoredImageUrl(string imageUrl) => rules.IsCloudBannerUrl(imageUrl) || IsLocalImageUrl(imageUrl);

    public async Task DeleteAsync(string imageUrl, CancellationToken cancellationToken)
    {
        if (rules.IsCloudBannerUrl(imageUrl))
        {
            await TryDeleteFromCloudAsync(imageUrl, cancellationToken);
            return;
        }

        DeleteLocalFile(imageUrl);
    }

    // A failure is only logged: the banner is already changed, and a file that stays behind does no harm.
    private async Task TryDeleteFromCloudAsync(string url, CancellationToken cancellationToken)
    {
        var asset = rules.TryGetCloudAsset(url);
        if (asset is null)
        {
            return;
        }

        try
        {
            await cloud.DeleteAsync(asset, cancellationToken);
        }
        catch (CloudMediaException exception)
        {
            logger.LogWarning(exception, "Không xóa được ảnh banner {PublicId} trên Cloudinary.", asset.PublicId);
        }
    }

    // A picture of the time before Cloudinary.
    private bool IsLocalImageUrl(string imageUrl) =>
        imageUrl.StartsWith(localUrlPrefix, StringComparison.Ordinal) &&
        imageUrl.Length > localUrlPrefix.Length &&
        imageUrl.IndexOfAny(['/', '\\', '?', '#', '%'], localUrlPrefix.Length) < 0 &&
        !imageUrl.Contains("..", StringComparison.Ordinal);

    private void DeleteLocalFile(string imageUrl)
    {
        if (!IsLocalImageUrl(imageUrl))
        {
            return;
        }

        var filePath = Path.GetFullPath(Path.Combine(bannerRoot, imageUrl[localUrlPrefix.Length..]));
        var root = Path.GetFullPath(bannerRoot);
        if (filePath.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) && File.Exists(filePath))
        {
            File.Delete(filePath);
        }
    }

    private static string? DetectExtension(ReadOnlySpan<byte> header, string contentType)
    {
        if (header.StartsWith(PngSignature) && contentType.Equals("image/png", StringComparison.OrdinalIgnoreCase))
        {
            return ".png";
        }
        if (header.StartsWith(JpegSignature) && contentType.Equals("image/jpeg", StringComparison.OrdinalIgnoreCase))
        {
            return ".jpg";
        }
        if (header.Length >= 12 && header[..4].SequenceEqual(WebPContainer) && header.Slice(8, 4).SequenceEqual(WebPType) &&
            contentType.Equals("image/webp", StringComparison.OrdinalIgnoreCase))
        {
            return ".webp";
        }
        return null;
    }
}
