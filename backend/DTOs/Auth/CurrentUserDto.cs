namespace TechForum.Api.Dtos.Auth;

public sealed record CurrentUserDto(
    string Id,
    string DisplayName,
    string? Bio,
    string? AvatarUrl,
    string Email,
    IReadOnlyList<string> Roles,
    // The reputation points of the member (see ReputationRules).
    int Reputation = 0);
