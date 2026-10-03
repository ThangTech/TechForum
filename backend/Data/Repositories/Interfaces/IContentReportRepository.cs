using TechForum.Api.Models;
using TechForum.Api.Enums;

namespace TechForum.Api.Data.Repositories;

public interface IContentReportRepository
{
    Task<Answer?> GetPublicAnswerAsync(int answerId, CancellationToken cancellationToken);
    Task<bool> PendingExistsAsync(string reporterId, int? topicId, int? answerId, CancellationToken cancellationToken);
    Task<bool> AddAsync(ContentReport report, CancellationToken cancellationToken);
    Task<ContentReportPage> GetPageAsync(
        ReportStatus? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
    Task<ContentReport?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<bool> ResolvePendingAsync(
        int id,
        ReportStatus status,
        string administratorId,
        DateTimeOffset resolvedAtUtc,
        string resolutionNote,
        CancellationToken cancellationToken);
}
