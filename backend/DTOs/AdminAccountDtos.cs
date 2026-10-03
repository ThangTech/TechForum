namespace TechForum.Api.Dtos;

public sealed record AdminAccountDto(
    string Id,
    string DisplayName,
    string Email,
    DateTimeOffset CreatedAtUtc,
    bool IsLocked,
    bool IsAdministrator);

public sealed record SetAccountLockRequest(bool IsLocked);
