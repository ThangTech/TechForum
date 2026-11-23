using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos.Auth;

namespace TechForum.Api.Services;

// Avatar nằm trên Cloudinary (thư mục "avatars"). Avatar cũ trên đĩa (/media/avatars/...) vẫn hiện
// và bị xóa trên đĩa khi được thay.
public sealed class AvatarService : IAvatarService
{
    private static readonly byte[] PngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    private static readonly byte[] JpegSignature = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] WebPContainer = "RIFF"u8.ToArray();
    private static readonly byte[] WebPType = "WEBP"u8.ToArray();

    private readonly IAccountRepository accountRepository;
    private readonly IWebHostEnvironment environment;
    private readonly ICloudMediaClient cloud;
    private readonly MediaUrlRules rules;
    private readonly ILogger<AvatarService> logger;
    private readonly MediaOptions options;

    public AvatarService(
        IAccountRepository accountRepository,
        IWebHostEnvironment environment,
        IOptions<MediaOptions> optionsAccessor,
        ICloudMediaClient cloud,
        MediaUrlRules rules,
        ILogger<AvatarService> logger)
    {
        this.accountRepository = accountRepository;
        this.environment = environment;
        this.cloud = cloud;
        this.rules = rules;
        this.logger = logger;
        options = optionsAccessor.Value;
    }

    private static Result<CurrentUserDto> InvalidAvatar(string message)
    {
        return Result<CurrentUserDto>.Fail(ErrorType.Validation, "Avatar chưa hợp lệ", message, "file");
    }

    public async Task<Result<CurrentUserDto>> UpdateAsync(
        string userId,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        var user = await accountRepository.FindByIdAsync(userId);
        if (user is null)
        {
            return Result<CurrentUserDto>.Fail(ErrorType.Unauthorized, "Bạn cần đăng nhập", "Phiên đăng nhập không còn hợp lệ.");
        }
        if (file.Length <= 0 || file.Length > options.MaxAvatarBytes)
        {
            return InvalidAvatar("Avatar phải có dung lượng từ 1 byte đến 2 MB.");
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
            return InvalidAvatar("Avatar chỉ hỗ trợ tệp PNG, JPEG hoặc WebP hợp lệ.");
        }

        if (!cloud.IsConfigured)
        {
            logger.LogError("Chưa cấu hình Cloudinary (CloudName, ApiKey, ApiSecret) nên không thể đổi avatar.");
            return InvalidAvatar("Chưa thể đổi avatar lúc này. Vui lòng thử lại sau.");
        }

        var (newAvatarUrl, uploadError) = await UploadAsync(file, extension, cancellationToken);
        if (newAvatarUrl is null)
        {
            return InvalidAvatar(uploadError!);
        }

        var oldAvatarUrl = user.AvatarUrl;
        user.AvatarUrl = newAvatarUrl;
        var updateResult = await accountRepository.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            // Tệp mới giờ không có chủ nên không để lại trên Cloudinary.
            await DeleteFromCloudAsync(newAvatarUrl, cancellationToken);
            return InvalidAvatar("Không thể cập nhật avatar lúc này.");
        }

        await DeleteOldAvatarAsync(oldAvatarUrl, cancellationToken);
        return Result<CurrentUserDto>.Success(await MapUserAsync(user));
    }

    public async Task<Result<CurrentUserDto>> DeleteAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await accountRepository.FindByIdAsync(userId);
        if (user is null)
        {
            return Result<CurrentUserDto>.Fail(ErrorType.Unauthorized, "Bạn cần đăng nhập", "Phiên đăng nhập không còn hợp lệ.");
        }
        var oldAvatarUrl = user.AvatarUrl;
        user.AvatarUrl = null;
        var updateResult = await accountRepository.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return Result<CurrentUserDto>.Fail(ErrorType.Unavailable, "Chưa xóa được avatar", "Không thể xóa avatar lúc này.");
        }
        await DeleteOldAvatarAsync(oldAvatarUrl, cancellationToken);
        return Result<CurrentUserDto>.Success(await MapUserAsync(user));
    }

    private async Task<CurrentUserDto> MapUserAsync(TechForum.Api.Models.ApplicationUser user)
    {
        return new(
            user.Id, user.DisplayName, user.Bio, user.AvatarUrl, user.Email ?? string.Empty,
            await accountRepository.GetRolesAsync(user));
    }

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
            // Kết nối vẫn tốt, Cloudinary từ chối chính tệp này: báo lý do cho thành viên.
            logger.LogInformation("Cloudinary từ chối avatar: {Reason}", exception.CloudMessage);
            return (null, CloudRejection.ToMessage(exception.CloudMessage));
        }
        catch (CloudMediaException exception)
        {
            logger.LogWarning(exception, "Không tải được avatar lên Cloudinary.");
            return (null, "Không thể lưu tệp lúc này. Vui lòng thử lại.");
        }
    }

    // Lỗi ở đây chỉ ghi log: avatar mới đã lưu xong.
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
