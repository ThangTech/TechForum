using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Constants;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class AdminAccountRepository : IAdminAccountRepository
{
    private readonly TechForumDbContext dbContext;
    private readonly UserManager<ApplicationUser> userManager;

    public AdminAccountRepository(TechForumDbContext dbContext, UserManager<ApplicationUser> userManager)
    {
        this.dbContext = dbContext;
        this.userManager = userManager;
    }

    public async Task<AdminAccountPage> GetPageAsync(
        AdminAccountFilter filter,
        DateTimeOffset now,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var (keyword, isLocked, isAdministrator) = (filter.Keyword, filter.IsLocked, filter.IsAdministrator);
        var query = dbContext.Users.AsNoTracking();
        if (filter.UnverifiedOnly)
        {
            query = query.Where(user => !user.EmailConfirmed);
        }
        if (isLocked.HasValue)
        {
            query = isLocked.Value
                ? query.Where(user => user.LockoutEnd != null && user.LockoutEnd > now)
                : query.Where(user => user.LockoutEnd == null || user.LockoutEnd <= now);
        }
        if (isAdministrator.HasValue)
        {
            query = query.Where(user => dbContext.UserRoles.Any(userRole =>
                userRole.UserId == user.Id && dbContext.Roles.Any(role =>
                    role.Id == userRole.RoleId && role.Name == RoleNames.Administrator)) == isAdministrator.Value);
        }
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var normalized = keyword.Trim();
            query = query.Where(user =>
                user.DisplayName.Contains(normalized) ||
                (user.Email != null && user.Email.Contains(normalized)));
        }

        var totalItems = await query.CountAsync(cancellationToken);
        // Mới tham gia trước: tài khoản lập ra để phá thường là tài khoản mới.
        var items = await Project(query
                .OrderByDescending(user => user.CreatedAtUtc)
                .ThenBy(user => user.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize))
            .ToListAsync(cancellationToken);
        return new AdminAccountPage(items, totalItems);
    }

    public Task<AdminAccountData?> GetDataAsync(string id, CancellationToken cancellationToken)
    {
        return Project(dbContext.Users.AsNoTracking().Where(user => user.Id == id)).SingleOrDefaultAsync(cancellationToken);
    }

    private IQueryable<AdminAccountData> Project(IQueryable<ApplicationUser> users)
    {
        return users.Select(user => new AdminAccountData(
            user,
            dbContext.UserRoles.Any(role =>
                role.UserId == user.Id && dbContext.Roles.Any(identityRole =>
                    identityRole.Id == role.RoleId && identityRole.Name == RoleNames.Administrator)),
            dbContext.Topics.Count(topic => topic.AuthorId == user.Id && !topic.IsDeleted),
            dbContext.Answers.Count(answer => answer.AuthorId == user.Id && !answer.IsDeleted),
            dbContext.ContentReports
                .Where(report => report.Status == ReportStatus.Accepted &&
                    ((report.Topic != null && report.Topic.AuthorId == user.Id) ||
                     (report.Answer != null && report.Answer.AuthorId == user.Id)))
                .Select(report => report.TopicId ?? report.AnswerId)
                .Distinct()
                .Count()));
    }

    public Task<int> CountAdministratorsAsync(CancellationToken cancellationToken)
    {
        return dbContext.UserRoles.CountAsync(userRole => dbContext.Roles.Any(role =>
            role.Id == userRole.RoleId && role.Name == RoleNames.Administrator), cancellationToken);
    }

    public async Task<IdentityResult> SetAdministratorAsync(ApplicationUser user, bool isAdministrator,
        AdminAuditLog auditLog, Notification notification, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var result = isAdministrator
            ? await userManager.AddToRoleAsync(user, RoleNames.Administrator)
            : await userManager.RemoveFromRoleAsync(user, RoleNames.Administrator);
        if (!result.Succeeded)
        {
            return result;
        }
        result = await userManager.UpdateSecurityStampAsync(user);
        if (!result.Succeeded)
        {
            return result;
        }
        dbContext.AdminAuditLogs.Add(auditLog);
        dbContext.Notifications.Add(notification);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return result;
    }

    public Task<ApplicationUser?> GetByIdAsync(string id) => userManager.FindByIdAsync(id);

    public Task<bool> IsAdministratorAsync(ApplicationUser user)
    {
        return userManager.IsInRoleAsync(user, RoleNames.Administrator);
    }

    public async Task<IdentityResult> SetLockedAsync(ApplicationUser user, bool isLocked, DateTimeOffset? lockoutEndUtc,
        string? reason, AdminAuditLog auditLog, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        user.LockReason = isLocked ? reason : null;
        var result = await userManager.SetLockoutEndDateAsync(
            user,
            isLocked ? lockoutEndUtc ?? DateTimeOffset.MaxValue : null);
        if (!result.Succeeded)
        {
            return result;
        }
        if (!isLocked)
        {
            result = await userManager.ResetAccessFailedCountAsync(user);
            if (!result.Succeeded)
            {
                return result;
            }
        }
        else
        {
            // Tài khoản bị khóa không được lấy access token mới bằng refresh token cũ.
            await dbContext.RefreshTokens
                .Where(token => token.UserId == user.Id && token.RevokedAtUtc == null)
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(token => token.RevokedAtUtc, auditLog.CreatedAtUtc),
                    cancellationToken);
        }
        dbContext.AdminAuditLogs.Add(auditLog);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return result;
    }
}
