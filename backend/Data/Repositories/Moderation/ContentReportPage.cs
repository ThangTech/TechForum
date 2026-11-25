using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record ContentReportPage(
    IReadOnlyList<ContentReport> Items,
    int TotalItems,
    // Theo mã báo cáo trong trang: số báo cáo đang chờ về cùng nội dung và lý do của chúng.
    IReadOnlyDictionary<Guid, ReportTargetSummary>? Summaries = null);

public sealed record ReportTargetSummary(int PendingCount, IReadOnlyList<string> Reasons);

public sealed record ReportFilter(ReportStatus? Status, bool? IsAnswer, string? Reason);

public sealed record PendingReport(Guid Id, string ReporterId);
