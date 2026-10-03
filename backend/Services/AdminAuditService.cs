using TechForum.Api.Data.Repositories;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class AdminAuditService(
    IAdminAuditRepository auditRepository,
    TimeProvider timeProvider) : IAdminAuditService
{
    public Task RecordAsync(
        string administratorId,
        string action,
        string targetType,
        string targetId,
        string? previousValue,
        string? newValue,
        string reason,
        CancellationToken cancellationToken) =>
        auditRepository.AddAsync(new AdminAuditLog
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
