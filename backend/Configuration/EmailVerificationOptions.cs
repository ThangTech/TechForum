namespace TechForum.Api.Configuration;

// Xác minh email khi đăng ký (mục "EmailVerification").
public sealed class EmailVerificationOptions
{
    public const string SectionName = "EmailVerification";

    // Tài khoản chưa xác minh sau chừng này ngày bị xóa, để trả email lại cho chủ thật.
    public int UnverifiedAccountDays { get; init; } = 7;
}
