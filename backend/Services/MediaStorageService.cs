using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Models;

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
    private readonly IMediaAssetRepository repository;
    private readonly TimeProvider timeProvider;

    public MediaStorageService(
        IWebHostEnvironment environment,
        IOptions<MediaOptions> optionsAccessor,
        IMediaAssetRepository repository,
        TimeProvider timeProvider)
    {
        options = optionsAccessor.Value;
        this.repository = repository;
        this.timeProvider = timeProvider;
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
        string uploaderId,
        IFormFile file,
        CancellationToken cancellationToken) =>
        StoreAsync(uploaderId, file, "images", options.MaxImageBytes, DetectImage, cancellationToken);

    public Task<MediaUploadResult> StoreVideoAsync(
        string uploaderId,
        IFormFile file,
        CancellationToken cancellationToken) =>
        StoreAsync(uploaderId, file, "videos", options.MaxVideoBytes, DetectVideo, cancellationToken);

    public async Task<MediaDeleteResult> DeleteUnusedAsync(
        string uploaderId,
        Guid id,
        CancellationToken cancellationToken)
    {
        var mediaAsset = await repository.GetOwnedAsync(id, uploaderId, cancellationToken);
        if (mediaAsset is null) return MediaDeleteResult.NotFound;
        if (mediaAsset.TopicId.HasValue) return MediaDeleteResult.Attached;

        DeleteStoredFile(mediaAsset.RelativePath);
        await repository.DeleteAsync(mediaAsset, cancellationToken);
        return MediaDeleteResult.Deleted;
    }

    public async Task<int> CleanupOrphansAsync(CancellationToken cancellationToken)
    {
        var retentionHours = Math.Max(1, options.OrphanRetentionHours);
        var batchSize = Math.Clamp(options.CleanupBatchSize, 1, 1000);
        var threshold = timeProvider.GetUtcNow().AddHours(-retentionHours);
        var orphans = await repository.GetOrphansOlderThanAsync(
            threshold,
            batchSize,
            cancellationToken);

        foreach (var orphan in orphans)
        {
            DeleteStoredFile(orphan.RelativePath);
            await repository.DeleteAsync(orphan, cancellationToken);
        }

        return orphans.Count;
    }

    private async Task<MediaUploadResult> StoreAsync(
        string uploaderId,
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

        var id = Guid.NewGuid();
        var directory = Path.Combine(storageRoot, folder);
        Directory.CreateDirectory(directory);
        var fileName = $"{id:N}{media.Extension}";
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

        var relativePath = Path.Combine(folder, fileName);
        var requestRoot = "/" + options.RequestPath.Trim('/');
        var publicUrl = $"{requestRoot}/{folder}/{fileName}";
        var mediaAsset = new MediaAsset
        {
            Id = id,
            UploaderId = uploaderId,
            RelativePath = relativePath,
            PublicUrl = publicUrl,
            ContentType = media.ContentTypes[0],
            Length = file.Length,
            CreatedAtUtc = timeProvider.GetUtcNow()
        };

        try
        {
            await repository.AddAsync(mediaAsset, cancellationToken);
        }
        catch
        {
            if (File.Exists(filePath)) File.Delete(filePath);
            throw;
        }

        return MediaUploadResult.Success(id, publicUrl);
    }

    private void DeleteStoredFile(string relativePath)
    {
        if (Path.IsPathRooted(relativePath))
        {
            throw new InvalidOperationException("Đường dẫn media trong dữ liệu không hợp lệ.");
        }

        var filePath = Path.GetFullPath(Path.Combine(storageRoot, relativePath));
        if (!filePath.StartsWith(storageRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Đường dẫn media nằm ngoài thư mục lưu trữ.");
        }

        if (File.Exists(filePath)) File.Delete(filePath);
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
