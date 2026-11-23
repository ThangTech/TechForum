using TechForum.Api.Dtos;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

// Kiểm tra ảnh hoặc video thành viên tải lên (kích thước, loại thật, chủ sở hữu) rồi lưu lên Cloudinary;
// DB chỉ giữ địa chỉ. Tệp cũ lưu trên đĩa trước khi chuyển sang Cloudinary vẫn được nhận và xóa trên đĩa.
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

    public Task<Result<MediaUploadDto>> StoreImageAsync(
        string uploaderId,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        return StoreAsync(uploaderId, file, "images", CloudResourceType.Image, options.MaxImageBytes, DetectImage, cancellationToken);
    }

    public Task<Result<MediaUploadDto>> StoreVideoAsync(
        string uploaderId,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        return StoreAsync(uploaderId, file, "videos", CloudResourceType.Video, options.MaxVideoBytes, DetectVideo, cancellationToken);
    }

    public async Task<Result> DeleteUnusedAsync(
        string uploaderId,
        Guid id,
        CancellationToken cancellationToken)
    {
        var mediaAsset = await repository.GetOwnedAsync(id, uploaderId, cancellationToken);
        if (mediaAsset is null)
        {
            return Result.Fail(ErrorType.NotFound, "Không tìm thấy media");
        }
        if (mediaAsset.TopicId.HasValue)
        {
            return Result.Fail(ErrorType.Conflict, "Media đang được sử dụng", "Không thể xóa media đã gắn với nội dung.");
        }

        try
        {
            await DeleteStoredFileAsync(mediaAsset, cancellationToken);
        }
        catch (CloudMediaException exception)
        {
            // Giữ bản ghi để thành viên hoặc việc dọn tự động xóa tệp sau.
            logger.LogWarning(exception, "Không xóa được media {MediaId} trên Cloudinary.", id);
            return Result.Fail(ErrorType.Unavailable, "Chưa xóa được media", "Không thể xóa tệp lúc này. Vui lòng thử lại sau.");
        }

        await repository.DeleteAsync(mediaAsset, cancellationToken);
        return Result.Success();
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
                // Một tệp chưa xóa được không làm dừng các tệp khác; lần chạy sau sẽ thử lại.
                logger.LogWarning(exception, "Không dọn được media {MediaId} trên Cloudinary.", orphan.Id);
                continue;
            }

            await repository.DeleteAsync(orphan, cancellationToken);
            deleted++;
        }

        return deleted;
    }

    private async Task<Result<MediaUploadDto>> StoreAsync(
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
            return Result<MediaUploadDto>.Fail(ErrorType.Validation, "Tệp tải lên không hợp lệ", $"Tệp phải có dung lượng từ 1 byte đến {maxBytes / 1024 / 1024} MB.");
        }

        // Loại thật đọc từ các byte đầu của tệp, không tin tên tệp hay loại trình duyệt báo.
        DetectedMedia? media;
        await using (var input = file.OpenReadStream())
        {
            var header = new byte[16];
            var bytesRead = await input.ReadAsync(header.AsMemory(), cancellationToken);
            media = detect(header[..bytesRead]);
        }

        if (media is null || !media.ContentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
        {
            return Result<MediaUploadDto>.Fail(ErrorType.Validation, "Tệp tải lên không hợp lệ", "Loại tệp hoặc nội dung tệp không được hỗ trợ.");
        }

        if (!cloud.IsConfigured)
        {
            // Thành viên chỉ thấy câu chung chung; chủ site đọc lý do trong log.
            logger.LogError("Chưa cấu hình Cloudinary (CloudName, ApiKey, ApiSecret) nên không thể tải media lên.");
            return Result<MediaUploadDto>.Fail(ErrorType.Unavailable, "Chưa thể lưu tệp", "Chưa thể lưu tệp lúc này. Vui lòng thử lại sau.");
        }

        var id = Guid.NewGuid();
        var publicId = rules.CreatePublicId(kind, id);
        string url;
        try
        {
            await using var content = file.OpenReadStream();
            url = await cloud.UploadAsync(content, $"{id:N}{media.Extension}", resourceType, publicId, cancellationToken);
        }
        catch (CloudMediaRejectedException exception)
        {
            // Kết nối vẫn tốt, Cloudinary từ chối chính tệp này: báo lý do cho thành viên.
            logger.LogInformation("Cloudinary từ chối media: {Reason}", exception.CloudMessage);
            return Result<MediaUploadDto>.Fail(ErrorType.Validation, "Tệp tải lên không hợp lệ", CloudRejection.ToMessage(exception.CloudMessage));
        }
        catch (CloudMediaException exception)
        {
            logger.LogWarning(exception, "Không tải được media lên Cloudinary.");
            return Result<MediaUploadDto>.Fail(ErrorType.Unavailable, "Chưa thể lưu tệp", "Không thể lưu tệp lúc này. Vui lòng thử lại.");
        }

        // Địa chỉ không khớp quy tắc sẽ bị bộ làm sạch HTML gỡ khỏi bài, nên từ chối ngay từ đây.
        if (!rules.IsTopicMediaUrl(url))
        {
            logger.LogWarning("Cloudinary trả về địa chỉ media không đúng quy tắc: {Url}", url);
            await TryDeleteFromCloudAsync(url, cancellationToken);
            return Result<MediaUploadDto>.Fail(ErrorType.Unavailable, "Chưa thể lưu tệp", "Không thể lưu tệp lúc này. Vui lòng thử lại.");
        }

        var mediaAsset = new MediaAsset
        {
            Id = id,
            UploaderId = uploaderId,
            // Tệp Cloudinary thì là id trên Cloudinary; tệp cũ thì là đường dẫn trên đĩa.
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

        return Result<MediaUploadDto>.Success(new MediaUploadDto(id, url, url));
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

    // Tệp đã tải lên nhưng không lưu được bản ghi: xóa đi để không còn tệp không chủ.
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

    private static bool StartsWith(byte[] value, byte[] signature)
    {
        return value.AsSpan().StartsWith(signature);
    }

    private sealed record DetectedMedia(string Extension, IReadOnlyList<string> ContentTypes);
}
