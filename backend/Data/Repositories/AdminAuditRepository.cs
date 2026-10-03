using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class AdminAuditRepository(TechForumDbContext dbContext) : IAdminAuditRepository
{
    public async Task AddAsync(AdminAuditLog auditLog, CancellationToken cancellationToken)
    {
        dbContext.AdminAuditLogs.Add(auditLog);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
