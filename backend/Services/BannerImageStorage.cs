using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;

namespace TechForum.Api.Services;

public sealed class BannerImageStorage : IBannerImageStorage
{
    private const string FolderName = "banners";
    private static readonly byte[] PngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    private static readonly byte[] JpegSignature = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] WebPContainer = "RIFF"u8.ToArray();
    private static readonly byte[] WebPType = "WEBP"u8.ToArray();

    private readonly MediaOptions options;
    private readonly string bannerRoot;
    private readonly string urlPrefix;

    public BannerImageStorage(IWebHostEnvironment environment, IOptions<MediaOptions> optionsAccessor)
    {
        options = optionsAccessor.Value;
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
        urlPrefix = $"/{options.RequestPath.Trim('/')}/{FolderName}/";
    }

    public async Task<BannerImageResult> SaveAsync(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length <= 0 || file.Length > options.MaxImageBytes)
        {
            return BannerImageResult.Invalid($"Ảnh banner phải có dung lượng từ 1 byte đến {options.MaxImageBytes / 1024 / 1024} MB.");
        }

        await using var input = file.OpenReadStream();
        var header = new byte[16];
        var bytesRead = await input.ReadAsync(header.AsMemory(), cancellationToken);
        var extension = DetectExtension(header.AsSpan(0, bytesRead), file.ContentType);
        if (extension is null)
        {
            return BannerImageResult.Invalid("Ảnh banner chỉ hỗ trợ tệp PNG, JPEG hoặc WebP hợp lệ.");
        }

        Directory.CreateDirectory(bannerRoot);
        var fileName = $"{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(bannerRoot, fileName);
        try
        {
            await using var output = new FileStream(filePath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, true);
            await output.WriteAsync(header.AsMemory(0, bytesRead), cancellationToken);
            await input.CopyToAsync(output, cancellationToken);
        }
        catch
        {
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
            throw;
        }

        return BannerImageResult.Success(urlPrefix + fileName);
    }

    public bool IsStoredImageUrl(string imageUrl) =>
        imageUrl.StartsWith(urlPrefix, StringComparison.Ordinal) &&
        imageUrl.Length > urlPrefix.Length &&
        imageUrl.IndexOfAny(['/', '\\', '?', '#', '%'], urlPrefix.Length) < 0 &&
        !imageUrl.Contains("..", StringComparison.Ordinal);

    public void Delete(string imageUrl)
    {
        if (!IsStoredImageUrl(imageUrl))
        {
            return;
        }

        var filePath = Path.GetFullPath(Path.Combine(bannerRoot, imageUrl[urlPrefix.Length..]));
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
