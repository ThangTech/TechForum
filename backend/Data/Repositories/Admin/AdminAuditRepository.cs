using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class AdminAuditRepository : IAdminAuditRepository
{
    private readonly TechForumDbContext dbContext;

    public AdminAuditRepository(TechForumDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    public async Task AddAsync(AdminAuditLog auditLog, CancellationToken cancellationToken)
    {
        dbContext.AdminAuditLogs.Add(auditLog);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
