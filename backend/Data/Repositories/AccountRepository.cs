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

    public Task<SignInResult> PasswordSignInAsync(
        ApplicationUser user,
        string password,
        bool rememberMe) =>
        signInManager.PasswordSignInAsync(
            user,
            password,
            rememberMe,
            lockoutOnFailure: true);

    public Task SignInAsync(ApplicationUser user) =>
        signInManager.SignInAsync(user, isPersistent: false);

    public Task SignOutAsync() => signInManager.SignOutAsync();

    public async Task<IReadOnlyList<string>> GetRolesAsync(ApplicationUser user) =>
        (await userManager.GetRolesAsync(user)).ToList();
}
