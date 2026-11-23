using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;

namespace TechForum.Api.Services;

// Uploads and deletes files in the Cloudinary account with the CloudinaryDotNet library. The request is made by the
// server with the API secret, which never goes to the browser.
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
            // The id is a new random name, so nothing is overwritten, and the name of the uploaded file is not used.
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

            // 400 is the answer for a file that Cloudinary does not accept. Other answers (wrong keys, too many requests, a
            // server error) are not the fault of the file.
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
                // A refused picture is kept by Cloudinary as a backup and uses space, so it is deleted at once.
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

    // With Cloudinary:ImageModeration set, the picture is checked while it is uploaded. When the add-on cannot check it
    // (not registered, or no free units left this month), the picture is uploaded again without the check, so members
    // can still post; the warning in the log says why.
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

        // The library closes the stream after an upload, so the picture (at most a few MB) is kept in memory to be sent
        // a second time if needed.
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
                // The copies that Cloudinary keeps for fast delivery are removed too.
                Invalidate = true
            });

            // "not found" means that it was removed before, which is what the caller wants.
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
