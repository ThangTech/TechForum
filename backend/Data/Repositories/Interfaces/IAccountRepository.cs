using Microsoft.AspNetCore.Identity;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IAccountRepository
{
    Task<ApplicationUser?> FindByEmailAsync(string email);

    Task<ApplicationUser?> FindByIdAsync(string userId);

    Task<IdentityResult> CreateMemberAsync(ApplicationUser user, string password);

    Task<SignInResult> CheckPasswordAsync(ApplicationUser user, string password);

    Task<bool> IsLockedOutAsync(ApplicationUser user);

    Task<IReadOnlyList<string>> GetRolesAsync(ApplicationUser user);

    Task<IdentityResult> UpdateAsync(ApplicationUser user);

    Task<IdentityResult> ChangePasswordAsync(
        ApplicationUser user,
        string currentPassword,
        string newPassword);
}
