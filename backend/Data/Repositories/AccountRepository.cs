using Microsoft.AspNetCore.Identity;
using TechForum.Api.Constants;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class AccountRepository(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager) : IAccountRepository
{
    public Task<ApplicationUser?> FindByEmailAsync(string email) =>
        userManager.FindByEmailAsync(email);

    public Task<ApplicationUser?> FindByIdAsync(string userId) =>
        userManager.FindByIdAsync(userId);

    public async Task<IdentityResult> CreateMemberAsync(
        ApplicationUser user,
        string password)
    {
        var createResult = await userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            return createResult;
        }

        var roleResult = await userManager.AddToRoleAsync(user, RoleNames.Member);
        if (roleResult.Succeeded)
        {
            return roleResult;
        }

        await userManager.DeleteAsync(user);
        return roleResult;
    }

    // Checks the password and counts failed attempts, so five wrong passwords lock the account.
    public Task<SignInResult> CheckPasswordAsync(ApplicationUser user, string password) =>
        signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);

    public Task<bool> IsLockedOutAsync(ApplicationUser user) =>
        userManager.IsLockedOutAsync(user);

    public async Task<IReadOnlyList<string>> GetRolesAsync(ApplicationUser user) =>
        (await userManager.GetRolesAsync(user)).ToList();

    public Task<IdentityResult> UpdateAsync(ApplicationUser user) =>
        userManager.UpdateAsync(user);

    public Task<IdentityResult> ChangePasswordAsync(
        ApplicationUser user,
        string currentPassword,
        string newPassword) =>
        userManager.ChangePasswordAsync(user, currentPassword, newPassword);
}
