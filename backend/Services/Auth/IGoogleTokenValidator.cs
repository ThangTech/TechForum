namespace TechForum.Api.Services;

// Tài khoản Google đã được xác minh. Subject là id cố định của tài khoản Google (email có thể đổi, subject thì không).
public sealed record GoogleIdentity(string Subject, string Email, bool EmailVerified, string? Name);

public interface IGoogleTokenValidator
{
    bool IsConfigured { get; }

    // Null khi token sai, hết hạn hoặc không cấp cho ứng dụng này.
    Task<GoogleIdentity?> ValidateAsync(string credential);
}
