namespace TechForum.Api.Models;

// One row per refresh token. Only the SHA-256 hash is stored, never the token itself.
public sealed class RefreshToken
{
    public Guid Id { get; set; }

    public required string UserId { get; set; }

    public ApplicationUser User { get; set; } = null!;

    public required string TokenHash { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset ExpiresAtUtc { get; set; }

    // Null means the token is still usable.
    public DateTimeOffset? RevokedAtUtc { get; set; }

    // Set when the token was rotated, so a reused old token can be detected.
    public string? ReplacedByTokenHash { get; set; }
}
