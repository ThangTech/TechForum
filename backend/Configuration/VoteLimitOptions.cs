namespace TechForum.Api.Configuration;

public sealed class VoteLimitOptions
{
    public const string SectionName = "VoteLimits";

    // Tài khoản mới lập không bình chọn được ngay, để không lập tài khoản chỉ để đẩy hoặc dìm điểm.
    public int MinAccountAgeDays { get; init; } = 3;

    // Bình chọn chưa tốt khó hơn vì đó là lá phiếu dùng để hại người khác: cần tài khoản đủ ngày HOẶC đủ
    // danh tiếng (người đã được tin tưởng thì được sớm hơn). Áp dụng thêm sau MinAccountAgeDays.
    public int DownvoteMinAccountAgeDays { get; init; } = 7;
    public int DownvoteMinReputation { get; init; } = 50;

    // Tính cả lần rút lại phiếu.
    public int PerMinute { get; init; } = 30;
    public int PerDay { get; init; } = 200;
}
