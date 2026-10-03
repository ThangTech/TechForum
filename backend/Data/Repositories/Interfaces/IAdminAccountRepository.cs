using Microsoft.AspNetCore.Identity;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IAdminAccountRepository
{
    Task<AdminAccountPage> GetPageAsync(
        string? keyword,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
    Task<ApplicationUser?> GetByIdAsync(string id);
    Task<bool> IsAdministratorAsync(ApplicationUser user);
    Task<IdentityResult> SetLockedAsync(ApplicationUser user, bool isLocked);
}
