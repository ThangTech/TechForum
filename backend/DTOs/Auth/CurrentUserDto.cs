namespace TechForum.Api.Dtos.Auth;

public sealed record CurrentUserDto(
    string Id,
    string DisplayName,
    string Email,
    IReadOnlyList<string> Roles);
