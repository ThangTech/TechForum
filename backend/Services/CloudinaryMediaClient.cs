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

    public CloudinaryMediaClient(IOptions<CloudinaryOptions> optionsAccessor)
    {
        var options = optionsAccessor.Value;
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
                result = await client.UploadAsync(
                    new ImageUploadParams { File = file, PublicId = publicId, Overwrite = false, UseFilename = false, UniqueFilename = false },
                    cancellationToken);
            }

            if (result.Error is not null || result.SecureUrl is null)
            {
                throw new CloudMediaException($"Cloudinary từ chối tệp: {result.Error?.Message ?? "không có địa chỉ trả về"}.");
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

    private Cloudinary GetClient() =>
        cloudinary ?? throw new CloudMediaException("Chưa cấu hình Cloudinary (CloudName, ApiKey, ApiSecret).");
}
