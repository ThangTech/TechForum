namespace TechForum.Api.Configuration;

public sealed class VoteLimitOptions
{
    public const string SectionName = "VoteLimits";

    // Số ngày tối thiểu trước khi được bình chọn (cả tốt lẫn chưa tốt). Mặc định 0: tài khoản đã xác minh email bình
    // chọn tốt được ngay, vì giới hạn mỗi phút/mỗi ngày đã chống tài khoản lập ra chỉ để đẩy điểm. Tăng lên nếu bị lạm dụng.
    public int MinAccountAgeDays { get; init; }

    // Bình chọn chưa tốt khó hơn vì đó là lá phiếu dùng để hại người khác: cần tài khoản đủ ngày HOẶC đủ
    // danh tiếng (người đã được tin tưởng thì được sớm hơn). Áp dụng thêm sau MinAccountAgeDays.
    public int DownvoteMinAccountAgeDays { get; init; } = 7;
    public int DownvoteMinReputation { get; init; } = 50;

    // Tính cả lần rút lại phiếu.
    public int PerMinute { get; init; } = 30;
    public int PerDay { get; init; } = 200;
}
