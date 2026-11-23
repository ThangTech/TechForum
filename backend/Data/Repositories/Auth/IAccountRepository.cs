using Microsoft.AspNetCore.Identity;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IAccountRepository
{
    Task<ApplicationUser?> FindByEmailAsync(string email);

    Task<ApplicationUser?> FindByIdAsync(string userId);

    Task<IdentityResult> CreateMemberAsync(ApplicationUser user, string password);

    // Tài khoản đăng nhập bằng nhà cung cấp ngoài (Google) không có mật khẩu.
    Task<IdentityResult> CreateExternalMemberAsync(ApplicationUser user, string provider, string providerKey);

    Task<ApplicationUser?> FindByLoginAsync(string provider, string providerKey);

    Task<IdentityResult> AddLoginAsync(ApplicationUser user, string provider, string providerKey);

    // Chủ email thật đã được xác minh: bỏ mật khẩu mà ai đó có thể đã đặt khi đăng ký bằng email này,
    // và đánh dấu email đã xác minh. Security stamp đổi nên access token cũ hết hiệu lực.
    Task<IdentityResult> ClaimByVerifiedEmailAsync(ApplicationUser user);

    Task<bool> HasPasswordAsync(ApplicationUser user);

    // Tên các nhà cung cấp đăng nhập đã liên kết, ví dụ "Google".
    Task<IReadOnlyList<string>> GetLoginProvidersAsync(ApplicationUser user);

    Task<IdentityResult> AddPasswordAsync(ApplicationUser user, string password);

    Task<SignInResult> CheckPasswordAsync(ApplicationUser user, string password);

    Task<bool> IsLockedOutAsync(ApplicationUser user);

    Task<IReadOnlyList<string>> GetRolesAsync(ApplicationUser user);

    Task<IdentityResult> UpdateAsync(ApplicationUser user);

    Task<IdentityResult> ChangePasswordAsync(
        ApplicationUser user,
        string currentPassword,
        string newPassword);
}
