using Microsoft.AspNetCore.Identity;
using TechForum.Api.Constants;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class AccountRepository : IAccountRepository
{
    private readonly UserManager<ApplicationUser> userManager;
    private readonly SignInManager<ApplicationUser> signInManager;

    public AccountRepository(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager)
    {
        this.userManager = userManager;
        this.signInManager = signInManager;
    }

    public Task<ApplicationUser?> FindByEmailAsync(string email)
    {
        return userManager.FindByEmailAsync(email);
    }

    public Task<ApplicationUser?> FindByIdAsync(string userId)
    {
        return userManager.FindByIdAsync(userId);
    }

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
    public Task<SignInResult> CheckPasswordAsync(ApplicationUser user, string password)
    {
        return signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);
    }

    public Task<bool> IsLockedOutAsync(ApplicationUser user)
    {
        return userManager.IsLockedOutAsync(user);
    }

    public async Task<IReadOnlyList<string>> GetRolesAsync(ApplicationUser user)
    {
        return (await userManager.GetRolesAsync(user)).ToList();
    }

    public Task<IdentityResult> UpdateAsync(ApplicationUser user)
    {
        return userManager.UpdateAsync(user);
    }

    public Task<IdentityResult> ChangePasswordAsync(
        ApplicationUser user,
        string currentPassword,
        string newPassword)
    {
        return userManager.ChangePasswordAsync(user, currentPassword, newPassword);
    }
}
