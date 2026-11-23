using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;

namespace TechForum.Api.Services;

// Yêu cầu tới Cloudinary do server gửi bằng API secret, khóa này không bao giờ tới trình duyệt.
public sealed class CloudinaryMediaClient : ICloudMediaClient
{
    private readonly Cloudinary? cloudinary;
    private readonly string imageModeration;
    private readonly ILogger<CloudinaryMediaClient> logger;

    public CloudinaryMediaClient(IOptions<CloudinaryOptions> optionsAccessor, ILogger<CloudinaryMediaClient> logger)
    {
        var options = optionsAccessor.Value;
        imageModeration = options.ImageModeration.Trim();
        this.logger = logger;
        if (options.IsConfigured)
        {
            cloudinary = new Cloudinary(new Account(options.CloudName, options.ApiKey, options.ApiSecret))
            {
                Api = { Secure = true }
            };
        }
    }

    public bool IsConfigured => cloudinary is not null;

    public async Task<string> UploadAsync(
        Stream content,
        string fileName,
        CloudResourceType resourceType,
        string publicId,
        CancellationToken cancellationToken)
    {
        var client = GetClient();
        var file = new FileDescription(fileName, content);

        try
        {
            // Id là tên ngẫu nhiên mới nên không ghi đè tệp nào, và không dùng tên tệp người dùng gửi lên.
            UploadResult result;
            if (resourceType == CloudResourceType.Video)
            {
                result = await client.UploadAsync(
                    new VideoUploadParams { File = file, PublicId = publicId, Overwrite = false, UseFilename = false, UniqueFilename = false },
                    cancellationToken);
            }
            else
            {
                result = await UploadImageAsync(client, content, fileName, publicId, cancellationToken);
            }

            // 400 là Cloudinary không nhận tệp; các lỗi khác (sai khóa, quá nhiều yêu cầu, lỗi server) không phải lỗi của tệp.
            if (result.Error is not null && result.StatusCode == System.Net.HttpStatusCode.BadRequest)
            {
                throw new CloudMediaRejectedException(result.Error.Message);
            }

            if (result.Error is not null || result.SecureUrl is null)
            {
                throw new CloudMediaException($"Cloudinary không nhận được tệp: {result.Error?.Message ?? "không có địa chỉ trả về"}.");
            }

            if (CloudModeration.IsRejected(result.Moderation))
            {
                // Cloudinary vẫn giữ ảnh bị từ chối làm bản dự phòng và tốn dung lượng, nên xóa ngay.
                await TryDestroyRejectedAsync(client, publicId);
                throw new CloudMediaRejectedException(CloudModeration.RejectedMessage);
            }

            return result.SecureUrl.AbsoluteUri;
        }
        catch (CloudMediaException)
        {
            throw;
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            throw new CloudMediaException("Không thể kết nối tới Cloudinary.", exception);
        }
    }

    // Khi add-on không kiểm duyệt được (chưa đăng ký, hết hạn mức tháng) thì tải lại không kiểm duyệt,
    // để thành viên vẫn đăng bài được; log ghi lý do.
    private async Task<UploadResult> UploadImageAsync(
        Cloudinary client, Stream content, string fileName, string publicId, CancellationToken cancellationToken)
    {
        ImageUploadParams Create(Stream file, string? moderation) => new()
        {
            File = new FileDescription(fileName, file),
            PublicId = publicId,
            Overwrite = false,
            UseFilename = false,
            UniqueFilename = false,
            Moderation = moderation
        };

        if (string.IsNullOrEmpty(imageModeration))
        {
            return await client.UploadAsync(Create(content, null), cancellationToken);
        }

        // Thư viện đóng stream sau khi tải lên, nên giữ ảnh (vài MB) trong bộ nhớ để gửi lần hai khi cần.
        using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, cancellationToken);
        var bytes = buffer.ToArray();

        var result = await client.UploadAsync(Create(new MemoryStream(bytes), imageModeration), cancellationToken);
        if (result.Error is null || !CloudModeration.IsUnavailable(result.Error.Message))
        {
            return result;
        }

        logger.LogWarning("Không kiểm duyệt được ảnh bằng {Moderation}: {Error}. Ảnh được tải lên không kiểm duyệt.",
            imageModeration, result.Error.Message);
        return await client.UploadAsync(Create(new MemoryStream(bytes), null), cancellationToken);
    }

    private async Task TryDestroyRejectedAsync(Cloudinary client, string publicId)
    {
        try
        {
            await client.DestroyAsync(new DeletionParams(publicId) { ResourceType = ResourceType.Image, Invalidate = true });
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Không xóa được ảnh bị từ chối {PublicId} trên Cloudinary.", publicId);
        }
    }

    public async Task DeleteAsync(CloudAsset asset, CancellationToken cancellationToken)
    {
        var client = GetClient();

        try
        {
            var result = await client.DestroyAsync(new DeletionParams(asset.PublicId)
            {
                ResourceType = asset.ResourceType == CloudResourceType.Video ? ResourceType.Video : ResourceType.Image,
                // Xóa cả các bản sao Cloudinary giữ để phân phối nhanh.
                Invalidate = true
            });

            // "not found" nghĩa là tệp đã bị xóa trước đó, đúng như nơi gọi muốn.
            if (result.Error is not null)
            {
                throw new CloudMediaException($"Cloudinary không xóa được tệp: {result.Error.Message}.");
            }
        }
        catch (CloudMediaException)
        {
            throw;
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            throw new CloudMediaException("Không thể kết nối tới Cloudinary.", exception);
        }
    }

    private Cloudinary GetClient()
    {
        return cloudinary ?? throw new CloudMediaException("Chưa cấu hình Cloudinary (CloudName, ApiKey, ApiSecret).");
    }
}
