using Microsoft.AspNetCore.Identity;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IAccountRepository
{
    Task<ApplicationUser?> FindByEmailAsync(string email);

    Task<ApplicationUser?> FindByIdAsync(string userId);

    Task<IdentityResult> CreateMemberAsync(ApplicationUser user, string password);

    Task<SignInResult> PasswordSignInAsync(
        ApplicationUser user,
        string password,
        bool rememberMe);

    Task SignInAsync(ApplicationUser user);

    Task SignOutAsync();

    Task<IReadOnlyList<string>> GetRolesAsync(ApplicationUser user);

    Task<IdentityResult> UpdateAsync(ApplicationUser user);

    Task<IdentityResult> ChangePasswordAsync(
        ApplicationUser user,
        string currentPassword,
        string newPassword);

    Task RefreshSignInAsync(ApplicationUser user);
}
