namespace TechForum.Api.Services;

public interface IAdminAuditService
{
    Task RecordAsync(
        string administratorId,
        string action,
        string targetType,
        string targetId,
        string? previousValue,
        string? newValue,
        string reason,
        CancellationToken cancellationToken);
}
