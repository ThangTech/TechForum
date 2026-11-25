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
    // Danh sách chờ xử lý chỉ hiện một dòng cho mỗi nội dung (báo cáo sớm nhất), kèm số báo cáo và lý do.
    Task<ContentReportPage> GetPageAsync(
        ReportFilter filter,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
    Task<ContentReport?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<ContentReportPage> GetMineAsync(string reporterId, ReportStatus? status,
        int page, int pageSize, CancellationToken cancellationToken);
    Task<IReadOnlyList<PendingReport>> GetPendingForTargetAsync(Guid? topicId, Guid? answerId, CancellationToken cancellationToken);
    // Xử lý cùng lúc mọi báo cáo trong danh sách; hideTarget thì ẩn luôn nội dung (quyết định của quản trị viên).
    // false khi có báo cáo vừa được người khác xử lý: không ghi gì.
    Task<bool> ResolvePendingAsync(
        IReadOnlyCollection<Guid> ids,
        ReportStatus status,
        string administratorId,
        DateTimeOffset resolvedAtUtc,
        string resolutionNote,
        Guid? topicId,
        Guid? answerId,
        bool hideTarget,
        IReadOnlyList<Notification> notifications,
        IReadOnlyList<AdminAuditLog> auditLogs,
        CancellationToken cancellationToken);
}
