using TechForum.Api.Data.Repositories;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class AdminAuditService : IAdminAuditService
{
    private readonly IAdminAuditRepository auditRepository;
    private readonly TimeProvider timeProvider;

    public AdminAuditService(IAdminAuditRepository auditRepository, TimeProvider timeProvider)
    {
        this.auditRepository = auditRepository;
        this.timeProvider = timeProvider;
    }

    public Task RecordAsync(
        string administratorId,
        string action,
        string targetType,
        string targetId,
        string? previousValue,
        string? newValue,
        string reason,
        CancellationToken cancellationToken)
    {
        return auditRepository.AddAsync(new AdminAuditLog
            {
                AdministratorId = administratorId,
                Action = action,
                TargetType = targetType,
                TargetId = targetId,
                PreviousValue = previousValue,
                NewValue = newValue,
                Reason = reason,
                CreatedAtUtc = timeProvider.GetUtcNow()
            }, cancellationToken);
    }
}
