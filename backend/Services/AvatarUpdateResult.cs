using TechForum.Api.Dtos.Auth;

namespace TechForum.Api.Services;

public sealed record AvatarUpdateResult(CurrentUserDto? User, string? Error)
{
    public bool Succeeded => User is not null;

    public static AvatarUpdateResult Success(CurrentUserDto user) => new(user, null);

    public static AvatarUpdateResult Invalid(string error) => new(null, error);
}
