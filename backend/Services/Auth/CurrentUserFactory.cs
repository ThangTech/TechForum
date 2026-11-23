using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos.Auth;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

// Một chỗ duy nhất tạo thông tin người dùng đang đăng nhập, để đăng nhập, sửa hồ sơ và đổi avatar trả về giống nhau.
public static class CurrentUserFactory
{
    public const string GoogleProvider = "Google";

    public static async Task<CurrentUserDto> CreateAsync(IAccountRepository accountRepository, ApplicationUser user)
    {
        var roles = await accountRepository.GetRolesAsync(user);
        var providers = await accountRepository.GetLoginProvidersAsync(user);
        return new CurrentUserDto(
            user.Id,
            user.DisplayName,
            user.Bio,
            user.AvatarUrl,
            user.Email ?? string.Empty,
            roles,
            ReputationRules.ForDisplay(user.Reputation),
            await accountRepository.HasPasswordAsync(user),
            providers.Contains(GoogleProvider));
    }
}
