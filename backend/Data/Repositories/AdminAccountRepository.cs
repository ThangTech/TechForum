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
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Users.AsNoTracking();
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
                    role.UserId == user.Id && role.RoleId == RoleNames.Administrator)))
            .ToListAsync(cancellationToken);
        return new AdminAccountPage(items, totalItems);
    }

    public Task<ApplicationUser?> GetByIdAsync(string id) => userManager.FindByIdAsync(id);

    public Task<bool> IsAdministratorAsync(ApplicationUser user) =>
        userManager.IsInRoleAsync(user, RoleNames.Administrator);

    public async Task<IdentityResult> SetLockedAsync(ApplicationUser user, bool isLocked)
    {
        var result = await userManager.SetLockoutEndDateAsync(
            user,
            isLocked ? DateTimeOffset.MaxValue : null);
        if (!result.Succeeded || isLocked) return result;
        return await userManager.ResetAccessFailedCountAsync(user);
    }
}
