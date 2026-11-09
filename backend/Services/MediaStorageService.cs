using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

// Checks a picture or a video that a member uploads (size, real type, owner) and keeps it in the Cloudinary account.
// The database keeps only the address that Cloudinary gives back. Files that were stored on the disk before the move
// to Cloudinary are still found and deleted from the disk.
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
    // The folder of the old files on the disk.
    private readonly string storageRoot;
    private readonly IMediaAssetRepository repository;
    private readonly ICloudMediaClient cloud;
    private readonly MediaUrlRules rules;
    private readonly TimeProvider timeProvider;
    private readonly ILogger<MediaStorageService> logger;

    public MediaStorageService(
        IWebHostEnvironment environment,
        IOptions<MediaOptions> optionsAccessor,
        IMediaAssetRepository repository,
        ICloudMediaClient cloud,
        MediaUrlRules rules,
        TimeProvider timeProvider,
        ILogger<MediaStorageService> logger)
    {
        options = optionsAccessor.Value;
        this.repository = repository;
        this.cloud = cloud;
        this.rules = rules;
        this.timeProvider = timeProvider;
        this.logger = logger;
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
        StoreAsync(uploaderId, file, "images", CloudResourceType.Image, options.MaxImageBytes, DetectImage, cancellationToken);

    public Task<MediaUploadResult> StoreVideoAsync(
        string uploaderId,
        IFormFile file,
        CancellationToken cancellationToken) =>
        StoreAsync(uploaderId, file, "videos", CloudResourceType.Video, options.MaxVideoBytes, DetectVideo, cancellationToken);

    public async Task<MediaDeleteResult> DeleteUnusedAsync(
        string uploaderId,
        Guid id,
        CancellationToken cancellationToken)
    {
        var mediaAsset = await repository.GetOwnedAsync(id, uploaderId, cancellationToken);
        if (mediaAsset is null)
        {
            return MediaDeleteResult.NotFound;
        }
        if (mediaAsset.TopicId.HasValue)
        {
            return MediaDeleteResult.Attached;
        }

        try
        {
            await DeleteStoredFileAsync(mediaAsset, cancellationToken);
        }
        catch (CloudMediaException exception)
        {
            // The record stays, so the file can be deleted later by the member or by the clean up.
            logger.LogWarning(exception, "Không xóa được media {MediaId} trên Cloudinary.", id);
            return MediaDeleteResult.Unavailable;
        }

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

        var deleted = 0;
        foreach (var orphan in orphans)
        {
            try
            {
                await DeleteStoredFileAsync(orphan, cancellationToken);
            }
            catch (CloudMediaException exception)
            {
                // One file that cannot be deleted now must not stop the others; it is tried again at the next run.
                logger.LogWarning(exception, "Không dọn được media {MediaId} trên Cloudinary.", orphan.Id);
                continue;
            }

            await repository.DeleteAsync(orphan, cancellationToken);
            deleted++;
        }

        return deleted;
    }

    private async Task<MediaUploadResult> StoreAsync(
        string uploaderId,
        IFormFile file,
        string kind,
        CloudResourceType resourceType,
        long maxBytes,
        Func<byte[], DetectedMedia?> detect,
        CancellationToken cancellationToken)
    {
        if (file.Length <= 0 || file.Length > maxBytes)
        {
            return MediaUploadResult.Invalid($"Tệp phải có dung lượng từ 1 byte đến {maxBytes / 1024 / 1024} MB.");
        }

        // The real type is read from the first bytes of the file, not from its name or the type that the browser says.
        DetectedMedia? media;
        await using (var input = file.OpenReadStream())
        {
            var header = new byte[16];
            var bytesRead = await input.ReadAsync(header.AsMemory(), cancellationToken);
            media = detect(header[..bytesRead]);
        }

        if (media is null || !media.ContentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
        {
            return MediaUploadResult.Invalid("Loại tệp hoặc nội dung tệp không được hỗ trợ.");
        }

        if (!cloud.IsConfigured)
        {
            return MediaUploadResult.Unavailable("Chưa cấu hình lưu trữ Cloudinary nên chưa thể tải tệp lên.");
        }

        var id = Guid.NewGuid();
        var publicId = rules.CreatePublicId(kind, id);
        string url;
        try
        {
            await using var content = file.OpenReadStream();
            url = await cloud.UploadAsync(content, $"{id:N}{media.Extension}", resourceType, publicId, cancellationToken);
        }
        catch (CloudMediaException exception)
        {
            logger.LogWarning(exception, "Không tải được media lên Cloudinary.");
            return MediaUploadResult.Unavailable("Không thể tải tệp lên Cloudinary lúc này. Vui lòng thử lại.");
        }

        // An address that the rules do not know would be removed from the topic by the sanitizer, so it is refused now.
        if (!rules.IsTopicMediaUrl(url))
        {
            await TryDeleteFromCloudAsync(url, cancellationToken);
            return MediaUploadResult.Unavailable("Cloudinary trả về địa chỉ không hợp lệ.");
        }

        var mediaAsset = new MediaAsset
        {
            Id = id,
            UploaderId = uploaderId,
            // For a file of Cloudinary this is its id there; for an old file it is the path on the disk.
            RelativePath = publicId,
            PublicUrl = url,
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
            await TryDeleteFromCloudAsync(url, CancellationToken.None);
            throw;
        }

        return MediaUploadResult.Success(id, url);
    }

    private async Task DeleteStoredFileAsync(MediaAsset mediaAsset, CancellationToken cancellationToken)
    {
        var cloudAsset = rules.TryGetCloudAsset(mediaAsset.PublicUrl);
        if (cloudAsset is not null)
        {
            await cloud.DeleteAsync(cloudAsset, cancellationToken);
            return;
        }

        DeleteStoredFile(mediaAsset.RelativePath);
    }

    // Used when a file was uploaded but the record could not be saved: the file is not left behind without an owner.
    private async Task TryDeleteFromCloudAsync(string url, CancellationToken cancellationToken)
    {
        var cloudAsset = rules.TryGetCloudAsset(url);
        if (cloudAsset is null)
        {
            return;
        }

        try
        {
            await cloud.DeleteAsync(cloudAsset, cancellationToken);
        }
        catch (CloudMediaException exception)
        {
            logger.LogWarning(exception, "Không xóa được tệp thừa {PublicId} trên Cloudinary.", cloudAsset.PublicId);
        }
    }

    // A file of the time before Cloudinary.
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

        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }
    }

    private static DetectedMedia? DetectImage(byte[] header)
    {
        if (StartsWith(header, PngSignature))
        {
            return new(".png", ["image/png"]);
        }
        if (StartsWith(header, JpegSignature))
        {
            return new(".jpg", ["image/jpeg"]);
        }
        if (StartsWith(header, Gif87Signature) || StartsWith(header, Gif89Signature))
        {
            return new(".gif", ["image/gif"]);
        }
        if (StartsWith(header, WebPContainer) && header.Length >= 12 &&
            header.AsSpan(8, 4).SequenceEqual(WebPType))
            return new(".webp", ["image/webp"]);
        return null;
    }

    private static DetectedMedia? DetectVideo(byte[] header)
    {
        if (header.Length >= 8 && header.AsSpan(4, 4).SequenceEqual(Mp4Type))
        {
            return new(".mp4", ["video/mp4"]);
        }
        if (StartsWith(header, WebMSignature))
        {
            return new(".webm", ["video/webm"]);
        }
        return null;
    }

    private static bool StartsWith(byte[] value, byte[] signature) =>
        value.AsSpan().StartsWith(signature);

    private sealed record DetectedMedia(string Extension, IReadOnlyList<string> ContentTypes);
}
