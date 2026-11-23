namespace TechForum.Api.Models;

// Chỉ lưu mã băm SHA-256, không bao giờ lưu token.
public sealed class RefreshToken
{
    public Guid Id { get; set; }

    public required string UserId { get; set; }

    public ApplicationUser User { get; set; } = null!;

    public required string TokenHash { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset ExpiresAtUtc { get; set; }

    public DateTimeOffset? RevokedAtUtc { get; set; }

    // Có giá trị khi token đã được xoay vòng, để phát hiện token cũ bị dùng lại.
    public string? ReplacedByTokenHash { get; set; }
}
