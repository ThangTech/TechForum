using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos.Auth;

namespace TechForum.Api.Services;

public sealed class AvatarService(
    IAccountRepository accountRepository,
    IWebHostEnvironment environment,
    IOptions<MediaOptions> optionsAccessor) : IAvatarService
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
        if (user is null) return AvatarUpdateResult.Invalid("Phiên đăng nhập không còn hợp lệ.");
        if (file.Length <= 0 || file.Length > options.MaxAvatarBytes)
            return AvatarUpdateResult.Invalid("Avatar phải có dung lượng từ 1 byte đến 2 MB.");

        await using var input = file.OpenReadStream();
        var header = new byte[16];
        var bytesRead = await input.ReadAsync(header.AsMemory(), cancellationToken);
        var extension = DetectExtension(header[..bytesRead], file.ContentType);
        if (extension is null)
            return AvatarUpdateResult.Invalid("Avatar chỉ hỗ trợ tệp PNG, JPEG hoặc WebP hợp lệ.");

        var storageRoot = GetStorageRoot();
        var avatarDirectory = Path.Combine(storageRoot, "avatars");
        Directory.CreateDirectory(avatarDirectory);
        var fileName = $"{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(avatarDirectory, fileName);
        await using (var output = new FileStream(filePath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, true))
        {
            await output.WriteAsync(header.AsMemory(0, bytesRead), cancellationToken);
            await input.CopyToAsync(output, cancellationToken);
        }

        var oldAvatarUrl = user.AvatarUrl;
        user.AvatarUrl = $"/{options.RequestPath.Trim('/')}/avatars/{fileName}";
        var updateResult = await accountRepository.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            File.Delete(filePath);
            return AvatarUpdateResult.Invalid("Không thể cập nhật avatar lúc này.");
        }

        DeleteOldAvatar(oldAvatarUrl, storageRoot);
        await accountRepository.RefreshSignInAsync(user);
        return AvatarUpdateResult.Success(await MapUserAsync(user));
    }

    public async Task<AvatarUpdateResult> DeleteAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await accountRepository.FindByIdAsync(userId);
        if (user is null) return AvatarUpdateResult.Invalid("Phiên đăng nhập không còn hợp lệ.");
        var oldAvatarUrl = user.AvatarUrl;
        user.AvatarUrl = null;
        var updateResult = await accountRepository.UpdateAsync(user);
        if (!updateResult.Succeeded) return AvatarUpdateResult.Invalid("Không thể xóa avatar lúc này.");
        DeleteOldAvatar(oldAvatarUrl, GetStorageRoot());
        await accountRepository.RefreshSignInAsync(user);
        return AvatarUpdateResult.Success(await MapUserAsync(user));
    }

    private async Task<CurrentUserDto> MapUserAsync(TechForum.Api.Models.ApplicationUser user) => new(
        user.Id, user.DisplayName, user.Bio, user.AvatarUrl, user.Email ?? string.Empty,
        await accountRepository.GetRolesAsync(user));

    private string GetStorageRoot()
    {
        if (Path.IsPathRooted(options.StoragePath)) throw new InvalidOperationException("Media:StoragePath phải là đường dẫn tương đối.");
        var contentRoot = Path.GetFullPath(environment.ContentRootPath);
        var storageRoot = Path.GetFullPath(Path.Combine(contentRoot, options.StoragePath));
        if (!storageRoot.StartsWith(contentRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Media:StoragePath không được nằm ngoài backend.");
        return storageRoot;
    }

    private static string? DetectExtension(ReadOnlySpan<byte> header, string contentType)
    {
        if (header.StartsWith(PngSignature) && contentType.Equals("image/png", StringComparison.OrdinalIgnoreCase)) return ".png";
        if (header.StartsWith(JpegSignature) && contentType.Equals("image/jpeg", StringComparison.OrdinalIgnoreCase)) return ".jpg";
        if (header.Length >= 12 && header[..4].SequenceEqual(WebPContainer) && header.Slice(8, 4).SequenceEqual(WebPType) && contentType.Equals("image/webp", StringComparison.OrdinalIgnoreCase)) return ".webp";
        return null;
    }

    private void DeleteOldAvatar(string? avatarUrl, string storageRoot)
    {
        var prefix = $"/{options.RequestPath.Trim('/')}/avatars/";
        if (avatarUrl is null || !avatarUrl.StartsWith(prefix, StringComparison.Ordinal)) return;
        var fileName = Path.GetFileName(avatarUrl);
        var filePath = Path.GetFullPath(Path.Combine(storageRoot, "avatars", fileName));
        var avatarRoot = Path.GetFullPath(Path.Combine(storageRoot, "avatars"));
        if (filePath.StartsWith(avatarRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) && File.Exists(filePath))
            File.Delete(filePath);
    }
}
