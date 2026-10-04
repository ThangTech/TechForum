namespace TechForum.Api.Dtos.Auth;

public sealed record CurrentUserDto(
    string Id,
    string DisplayName,
    string? Bio,
    string Email,
    IReadOnlyList<string> Roles);
