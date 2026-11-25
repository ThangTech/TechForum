using Microsoft.AspNetCore.Identity;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class PasswordRecoveryRepository : IPasswordRecoveryRepository
{
    private readonly UserManager<ApplicationUser> userManager;

    public PasswordRecoveryRepository(UserManager<ApplicationUser> userManager)
    {
        this.userManager = userManager;
    }

    public Task<ApplicationUser?> FindByEmailAsync(string email) => userManager.FindByEmailAsync(email);
    public Task<string> GenerateTokenAsync(ApplicationUser user) => userManager.GeneratePasswordResetTokenAsync(user);
    public Task<IdentityResult> ResetAsync(ApplicationUser user, string token, string password)
    {
        return userManager.ResetPasswordAsync(user, token, password);
    }

    public async Task<IdentityResult> MarkEmailConfirmedAsync(ApplicationUser user)
    {
        if (user.EmailConfirmed)
        {
            return IdentityResult.Success;
        }

        user.EmailConfirmed = true;
        return await userManager.UpdateAsync(user);
    }
}
