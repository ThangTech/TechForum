using Microsoft.AspNetCore.Identity;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IPasswordRecoveryRepository
{
    Task<ApplicationUser?> FindByEmailAsync(string email);
    Task<string> GenerateTokenAsync(ApplicationUser user);
    Task<IdentityResult> ResetAsync(ApplicationUser user, string token, string password);
}
