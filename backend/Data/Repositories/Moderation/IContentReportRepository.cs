using TechForum.Api.Models;
using TechForum.Api.Enums;

namespace TechForum.Api.Data.Repositories;

public interface IContentReportRepository
{
    Task<Answer?> GetPublicAnswerAsync(Guid answerId, CancellationToken cancellationToken);
    Task<bool> PendingExistsAsync(string reporterId, Guid? topicId, Guid? answerId, CancellationToken cancellationToken);
    Task<bool> AddAsync(ContentReport report, CancellationToken cancellationToken);
    // The number of different members with a waiting report on the content, counting only accounts made before the date.
    Task<int> CountPendingReportersAsync(Guid? topicId, Guid? answerId, DateTimeOffset accountsCreatedBefore, CancellationToken cancellationToken);
    Task<bool> HasAcceptedReportAsync(Guid? topicId, Guid? answerId, CancellationToken cancellationToken);
    // Hides the content that is still shown and saves the notification for its author, together. False when it was
    // already hidden or deleted.
    Task<bool> AutoHideAsync(Guid? topicId, Guid? answerId, DateTimeOffset now, Notification notification, CancellationToken cancellationToken);
    // Shows again the content that hid itself, with the notification for its author. False when it is not auto-hidden.
    Task<bool> ShowAutoHiddenAsync(Guid? topicId, Guid? answerId, Notification notification, CancellationToken cancellationToken);
    // A moderator decided (accepted a report): the content stays hidden, but it is no longer "hidden by the reports".
    Task KeepHiddenByModeratorAsync(Guid? topicId, Guid? answerId, CancellationToken cancellationToken);
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
