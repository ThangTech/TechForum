using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Constants;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class AdminAccountRepository(
    TechForumDbContext dbContext,
    UserManager<ApplicationUser> userManager) : IAdminAccountRepository
{
    public async Task<AdminAccountPage> GetPageAsync(
        string? keyword,
        bool? isLocked,
        bool? isAdministrator,
        DateTimeOffset now,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Users.AsNoTracking();
        if (isLocked.HasValue)
            query = isLocked.Value
                ? query.Where(user => user.LockoutEnd != null && user.LockoutEnd > now)
                : query.Where(user => user.LockoutEnd == null || user.LockoutEnd <= now);
        if (isAdministrator.HasValue)
            query = query.Where(user => dbContext.UserRoles.Any(userRole =>
                userRole.UserId == user.Id && dbContext.Roles.Any(role =>
                    role.Id == userRole.RoleId && role.Name == RoleNames.Administrator)) == isAdministrator.Value);
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var normalized = keyword.Trim();
            query = query.Where(user =>
                user.DisplayName.Contains(normalized) ||
                (user.Email != null && user.Email.Contains(normalized)));
        }

        var totalItems = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(user => user.DisplayName)
            .ThenBy(user => user.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(user => new AdminAccountData(
                user,
                dbContext.UserRoles.Any(role =>
                    role.UserId == user.Id && dbContext.Roles.Any(identityRole =>
                        identityRole.Id == role.RoleId && identityRole.Name == RoleNames.Administrator))))
            .ToListAsync(cancellationToken);
        return new AdminAccountPage(items, totalItems);
    }

    public Task<ApplicationUser?> GetByIdAsync(string id) => userManager.FindByIdAsync(id);

    public Task<bool> IsAdministratorAsync(ApplicationUser user) =>
        userManager.IsInRoleAsync(user, RoleNames.Administrator);

    public async Task<IdentityResult> SetLockedAsync(ApplicationUser user, bool isLocked, DateTimeOffset? lockoutEndUtc,
        string? reason, AdminAuditLog auditLog, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        user.LockReason = isLocked ? reason : null;
        var result = await userManager.SetLockoutEndDateAsync(
            user,
            isLocked ? lockoutEndUtc ?? DateTimeOffset.MaxValue : null);
        if (!result.Succeeded) return result;
        if (!isLocked)
        {
            result = await userManager.ResetAccessFailedCountAsync(user);
            if (!result.Succeeded) return result;
        }
        dbContext.AdminAuditLogs.Add(auditLog);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return result;
    }
}
