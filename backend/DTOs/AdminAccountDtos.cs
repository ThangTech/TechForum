namespace TechForum.Api.Dtos;

public sealed record AdminAccountDto(
    string Id,
    string DisplayName,
    string Email,
    DateTimeOffset CreatedAtUtc,
    bool IsLocked,
    bool IsAdministrator,
    string? LockReason,
    DateTimeOffset? LockoutEndUtc);

public sealed record SetAccountLockRequest(bool IsLocked, string? Reason = null, DateTimeOffset? LockoutEndUtc = null);
