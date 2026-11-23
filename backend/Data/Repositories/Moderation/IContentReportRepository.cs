using TechForum.Api.Models;
using TechForum.Api.Enums;

namespace TechForum.Api.Data.Repositories;

public interface IContentReportRepository
{
    Task<Answer?> GetPublicAnswerAsync(Guid answerId, CancellationToken cancellationToken);
    Task<bool> PendingExistsAsync(string reporterId, Guid? topicId, Guid? answerId, CancellationToken cancellationToken);
    Task<bool> AddAsync(ContentReport report, CancellationToken cancellationToken);
    // Số người khác nhau có báo cáo đang chờ, chỉ tính tài khoản tạo trước mốc thời gian.
    Task<int> CountPendingReportersAsync(Guid? topicId, Guid? answerId, DateTimeOffset accountsCreatedBefore, CancellationToken cancellationToken);
    Task<bool> HasAcceptedReportAsync(Guid? topicId, Guid? answerId, CancellationToken cancellationToken);
    // Ẩn nội dung đang hiện và lưu thông báo cho tác giả cùng lúc; false khi đã bị ẩn hoặc đã xóa.
    Task<bool> AutoHideAsync(Guid? topicId, Guid? answerId, DateTimeOffset now, Notification notification, CancellationToken cancellationToken);
    // Hiện lại nội dung đã tự ẩn và lưu thông báo cho tác giả; false khi nó không ở trạng thái tự ẩn.
    Task<bool> ShowAutoHiddenAsync(Guid? topicId, Guid? answerId, Notification notification, CancellationToken cancellationToken);
    // Quản trị viên chấp nhận báo cáo: nội dung vẫn ẩn, nhưng không còn là "tự ẩn vì báo cáo".
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
