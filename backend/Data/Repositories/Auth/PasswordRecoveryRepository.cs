using Microsoft.AspNetCore.Identity;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class PasswordRecoveryRepository(UserManager<ApplicationUser> userManager) : IPasswordRecoveryRepository
{
    public Task<ApplicationUser?> FindByEmailAsync(string email) => userManager.FindByEmailAsync(email);
    public Task<string> GenerateTokenAsync(ApplicationUser user) => userManager.GeneratePasswordResetTokenAsync(user);
    public Task<IdentityResult> ResetAsync(ApplicationUser user, string token, string password) =>
        userManager.ResetPasswordAsync(user, token, password);
}
