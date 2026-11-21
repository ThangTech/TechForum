using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IAdminAuditRepository
{
    Task AddAsync(AdminAuditLog auditLog, CancellationToken cancellationToken);
}
