using TechForum.Api.Models;
using TechForum.Api.Enums;

namespace TechForum.Api.Data.Repositories;

public interface IContentReportRepository
{
    Task<Answer?> GetPublicAnswerAsync(Guid answerId, CancellationToken cancellationToken);
    Task<bool> PendingExistsAsync(string reporterId, Guid? topicId, Guid? answerId, CancellationToken cancellationToken);
    Task<bool> AddAsync(ContentReport report, CancellationToken cancellationToken);
    Task<ContentReportPage> GetPageAsync(
        ReportStatus? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
    Task<ContentReport?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<ContentReportPage> GetMineAsync(string reporterId, ReportStatus? status,
        int page, int pageSize, CancellationToken cancellationToken);
    Task<bool> ResolvePendingAsync(
        Guid id,
        ReportStatus status,
        string administratorId,
        DateTimeOffset resolvedAtUtc,
        string resolutionNote,
        Notification notification,
        AdminAuditLog auditLog,
        CancellationToken cancellationToken);
}
