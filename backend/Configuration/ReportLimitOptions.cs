namespace TechForum.Api.Configuration;

// Khi nào nội dung bị báo cáo tự ẩn trước khi quản trị viên xem (mục "Reports" của cấu hình).
public sealed class ReportLimitOptions
{
    public const string SectionName = "Reports";

    public int AutoHideThreshold { get; init; } = 5;

    // Chỉ tính tài khoản đủ tuổi, để vài tài khoản lập ra cố ý không ẩn được nội dung của người khác.
    public int MinReporterAccountAgeDays { get; init; } = 3;
}
