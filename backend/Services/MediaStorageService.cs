using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;

namespace TechForum.Api.Services;

public sealed class MediaStorageService : IMediaStorageService
{
    private static readonly byte[] PngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    private static readonly byte[] JpegSignature = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] Gif87Signature = "GIF87a"u8.ToArray();
    private static readonly byte[] Gif89Signature = "GIF89a"u8.ToArray();
    private static readonly byte[] WebPContainer = "RIFF"u8.ToArray();
    private static readonly byte[] WebPType = "WEBP"u8.ToArray();
    private static readonly byte[] Mp4Type = "ftyp"u8.ToArray();
    private static readonly byte[] WebMSignature = [0x1A, 0x45, 0xDF, 0xA3];

    private readonly MediaOptions options;
    private readonly string storageRoot;

    public MediaStorageService(
        IWebHostEnvironment environment,
        IOptions<MediaOptions> optionsAccessor)
    {
        options = optionsAccessor.Value;
        if (Path.IsPathRooted(options.StoragePath))
        {
            throw new InvalidOperationException("Media:StoragePath phải là đường dẫn tương đối trong backend.");
        }

        var contentRoot = Path.GetFullPath(environment.ContentRootPath);
        storageRoot = Path.GetFullPath(Path.Combine(contentRoot, options.StoragePath));
        if (!storageRoot.StartsWith(contentRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Media:StoragePath không được nằm ngoài backend.");
        }
    }

    public Task<MediaUploadResult> StoreImageAsync(
        IFormFile file,
        CancellationToken cancellationToken) =>
        StoreAsync(file, "images", options.MaxImageBytes, DetectImage, cancellationToken);

    public Task<MediaUploadResult> StoreVideoAsync(
        IFormFile file,
        CancellationToken cancellationToken) =>
        StoreAsync(file, "videos", options.MaxVideoBytes, DetectVideo, cancellationToken);

    private async Task<MediaUploadResult> StoreAsync(
        IFormFile file,
        string folder,
        long maxBytes,
        Func<byte[], DetectedMedia?> detect,
        CancellationToken cancellationToken)
    {
        if (file.Length <= 0 || file.Length > maxBytes)
        {
            return MediaUploadResult.Invalid($"Tệp phải có dung lượng từ 1 byte đến {maxBytes / 1024 / 1024} MB.");
        }

        await using var input = file.OpenReadStream();
        var header = new byte[16];
        var bytesRead = await input.ReadAsync(header.AsMemory(), cancellationToken);
        var media = detect(header[..bytesRead]);
        if (media is null || !media.ContentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
        {
            return MediaUploadResult.Invalid("Loại tệp hoặc nội dung tệp không được hỗ trợ.");
        }

        var directory = Path.Combine(storageRoot, folder);
        Directory.CreateDirectory(directory);
        var fileName = $"{Guid.NewGuid():N}{media.Extension}";
        var filePath = Path.Combine(directory, fileName);

        try
        {
            await using var output = new FileStream(
                filePath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                81920,
                FileOptions.Asynchronous);
            await output.WriteAsync(header.AsMemory(0, bytesRead), cancellationToken);
            await input.CopyToAsync(output, cancellationToken);
        }
        catch
        {
            if (File.Exists(filePath)) File.Delete(filePath);
            throw;
        }

        var requestRoot = "/" + options.RequestPath.Trim('/');
        return MediaUploadResult.Success($"{requestRoot}/{folder}/{fileName}");
    }

    private static DetectedMedia? DetectImage(byte[] header)
    {
        if (StartsWith(header, PngSignature)) return new(".png", ["image/png"]);
        if (StartsWith(header, JpegSignature)) return new(".jpg", ["image/jpeg"]);
        if (StartsWith(header, Gif87Signature) || StartsWith(header, Gif89Signature))
            return new(".gif", ["image/gif"]);
        if (StartsWith(header, WebPContainer) && header.Length >= 12 &&
            header.AsSpan(8, 4).SequenceEqual(WebPType))
            return new(".webp", ["image/webp"]);
        return null;
    }

    private static DetectedMedia? DetectVideo(byte[] header)
    {
        if (header.Length >= 8 && header.AsSpan(4, 4).SequenceEqual(Mp4Type))
            return new(".mp4", ["video/mp4"]);
        if (StartsWith(header, WebMSignature)) return new(".webm", ["video/webm"]);
        return null;
    }

    private static bool StartsWith(byte[] value, byte[] signature) =>
        value.AsSpan().StartsWith(signature);

    private sealed record DetectedMedia(string Extension, IReadOnlyList<string> ContentTypes);
}
