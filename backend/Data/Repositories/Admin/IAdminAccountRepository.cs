using Microsoft.AspNetCore.Identity;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IAdminAccountRepository
{
    Task<AdminAccountPage> GetPageAsync(
        AdminAccountFilter filter,
        DateTimeOffset now,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
    Task<ApplicationUser?> GetByIdAsync(string id);
    Task<bool> IsAdministratorAsync(ApplicationUser user);
    Task<AdminAccountData?> GetDataAsync(string id, CancellationToken cancellationToken);
    Task<int> CountAdministratorsAsync(CancellationToken cancellationToken);
    // Cấp hoặc thu quyền quản trị, đổi security stamp để token cũ (mang vai trò cũ) hết hiệu lực ngay.
    Task<IdentityResult> SetAdministratorAsync(ApplicationUser user, bool isAdministrator, AdminAuditLog auditLog,
        Notification notification, CancellationToken cancellationToken);
    Task<IdentityResult> SetLockedAsync(ApplicationUser user, bool isLocked, DateTimeOffset? lockoutEndUtc,
        string? reason, AdminAuditLog auditLog, CancellationToken cancellationToken);
}
