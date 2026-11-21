using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos.Auth;

namespace TechForum.Api.Services;

// The avatar of a member is kept in the Cloudinary account (folder "avatars"). The user record keeps the address.
// An avatar of the time before Cloudinary (/media/avatars/...) is still shown and is deleted from the disk when it
// is replaced.
public sealed class AvatarService(
    IAccountRepository accountRepository,
    IWebHostEnvironment environment,
    IOptions<MediaOptions> optionsAccessor,
    ICloudMediaClient cloud,
    MediaUrlRules rules,
    ILogger<AvatarService> logger) : IAvatarService
{
    private static readonly byte[] PngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    private static readonly byte[] JpegSignature = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] WebPContainer = "RIFF"u8.ToArray();
    private static readonly byte[] WebPType = "WEBP"u8.ToArray();
    private readonly MediaOptions options = optionsAccessor.Value;

    public async Task<AvatarUpdateResult> UpdateAsync(
        string userId,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        var user = await accountRepository.FindByIdAsync(userId);
        if (user is null)
        {
            return AvatarUpdateResult.Invalid("Phiên đăng nhập không còn hợp lệ.");
        }
        if (file.Length <= 0 || file.Length > options.MaxAvatarBytes)
        {
            return AvatarUpdateResult.Invalid("Avatar phải có dung lượng từ 1 byte đến 2 MB.");
        }

        string? extension;
        await using (var input = file.OpenReadStream())
        {
            var header = new byte[16];
            var bytesRead = await input.ReadAsync(header.AsMemory(), cancellationToken);
            extension = DetectExtension(header[..bytesRead], file.ContentType);
        }

        if (extension is null)
        {
            return AvatarUpdateResult.Invalid("Avatar chỉ hỗ trợ tệp PNG, JPEG hoặc WebP hợp lệ.");
        }

        if (!cloud.IsConfigured)
        {
            logger.LogError("Chưa cấu hình Cloudinary (CloudName, ApiKey, ApiSecret) nên không thể đổi avatar.");
            return AvatarUpdateResult.Invalid("Chưa thể đổi avatar lúc này. Vui lòng thử lại sau.");
        }

        var (newAvatarUrl, uploadError) = await UploadAsync(file, extension, cancellationToken);
        if (newAvatarUrl is null)
        {
            return AvatarUpdateResult.Invalid(uploadError!);
        }

        var oldAvatarUrl = user.AvatarUrl;
        user.AvatarUrl = newAvatarUrl;
        var updateResult = await accountRepository.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            // The new file has no owner now, so it is not left in the account.
            await DeleteFromCloudAsync(newAvatarUrl, cancellationToken);
            return AvatarUpdateResult.Invalid("Không thể cập nhật avatar lúc này.");
        }

        await DeleteOldAvatarAsync(oldAvatarUrl, cancellationToken);
        return AvatarUpdateResult.Success(await MapUserAsync(user));
    }

    public async Task<AvatarUpdateResult> DeleteAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await accountRepository.FindByIdAsync(userId);
        if (user is null)
        {
            return AvatarUpdateResult.Invalid("Phiên đăng nhập không còn hợp lệ.");
        }
        var oldAvatarUrl = user.AvatarUrl;
        user.AvatarUrl = null;
        var updateResult = await accountRepository.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return AvatarUpdateResult.Invalid("Không thể xóa avatar lúc này.");
        }
        await DeleteOldAvatarAsync(oldAvatarUrl, cancellationToken);
        return AvatarUpdateResult.Success(await MapUserAsync(user));
    }

    private async Task<CurrentUserDto> MapUserAsync(TechForum.Api.Models.ApplicationUser user) => new(
        user.Id, user.DisplayName, user.Bio, user.AvatarUrl, user.Email ?? string.Empty,
        await accountRepository.GetRolesAsync(user));

    private string GetStorageRoot()
    {
        if (Path.IsPathRooted(options.StoragePath))
        {
            throw new InvalidOperationException("Media:StoragePath phải là đường dẫn tương đối.");
        }
        var contentRoot = Path.GetFullPath(environment.ContentRootPath);
        var storageRoot = Path.GetFullPath(Path.Combine(contentRoot, options.StoragePath));
        if (!storageRoot.StartsWith(contentRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Media:StoragePath không được nằm ngoài backend.");
        }
        return storageRoot;
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
        if (header.Length >= 12 && header[..4].SequenceEqual(WebPContainer) && header.Slice(8, 4).SequenceEqual(WebPType) && contentType.Equals("image/webp", StringComparison.OrdinalIgnoreCase))
        {
            return ".webp";
        }
        return null;
    }

    // The address of the new avatar, or the sentence for the member when Cloudinary did not take the file.
    private async Task<(string? Url, string? Error)> UploadAsync(
        IFormFile file, string extension, CancellationToken cancellationToken)
    {
        var id = Guid.NewGuid();
        try
        {
            await using var content = file.OpenReadStream();
            var url = await cloud.UploadAsync(
                content, $"{id:N}{extension}", CloudResourceType.Image, rules.CreatePublicId("avatars", id), cancellationToken);
            if (rules.IsCloudAvatarUrl(url))
            {
                return (url, null);
            }

            logger.LogWarning("Cloudinary trả về địa chỉ avatar không đúng quy tắc: {Url}", url);
            await DeleteFromCloudAsync(url, cancellationToken);
            return (null, "Không thể lưu tệp lúc này. Vui lòng thử lại.");
        }
        catch (CloudMediaRejectedException exception)
        {
            // The connection works and Cloudinary refused the file itself: the member is told why.
            logger.LogInformation("Cloudinary từ chối avatar: {Reason}", exception.CloudMessage);
            return (null, CloudRejection.ToMessage(exception.CloudMessage));
        }
        catch (CloudMediaException exception)
        {
            logger.LogWarning(exception, "Không tải được avatar lên Cloudinary.");
            return (null, "Không thể lưu tệp lúc này. Vui lòng thử lại.");
        }
    }

    // The old avatar is not needed any more. A failure here is only logged: the new avatar is already saved.
    private async Task DeleteOldAvatarAsync(string? avatarUrl, CancellationToken cancellationToken)
    {
        if (avatarUrl is null)
        {
            return;
        }

        if (rules.IsCloudAvatarUrl(avatarUrl))
        {
            await DeleteFromCloudAsync(avatarUrl, cancellationToken);
            return;
        }

        DeleteOldLocalAvatar(avatarUrl, GetStorageRoot());
    }

    private async Task DeleteFromCloudAsync(string url, CancellationToken cancellationToken)
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
            logger.LogWarning(exception, "Không xóa được avatar {PublicId} trên Cloudinary.", asset.PublicId);
        }
    }

    // An avatar of the time before Cloudinary.
    private void DeleteOldLocalAvatar(string avatarUrl, string storageRoot)
    {
        var prefix = $"/{options.RequestPath.Trim('/')}/avatars/";
        if (!avatarUrl.StartsWith(prefix, StringComparison.Ordinal))
        {
            return;
        }
        var fileName = Path.GetFileName(avatarUrl);
        var filePath = Path.GetFullPath(Path.Combine(storageRoot, "avatars", fileName));
        var avatarRoot = Path.GetFullPath(Path.Combine(storageRoot, "avatars"));
        if (filePath.StartsWith(avatarRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) && File.Exists(filePath))
        {
            File.Delete(filePath);
        }
    }
}
