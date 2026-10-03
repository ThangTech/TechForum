using TechForum.Api.Dtos.Auth;
using TechForum.Api.Enums;

namespace TechForum.Api.Services;

public sealed record AuthResult(
    CurrentUserDto? User,
    AuthFailureKind Failure,
    IReadOnlyDictionary<string, string[]> Errors)
{
    public bool Succeeded => User is not null && Failure == AuthFailureKind.None;

    public static AuthResult Success(CurrentUserDto user) =>
        new(user, AuthFailureKind.None, new Dictionary<string, string[]>());

    public static AuthResult Failed(
        AuthFailureKind failure,
        IReadOnlyDictionary<string, string[]>? errors = null) =>
        new(null, failure, errors ?? new Dictionary<string, string[]>());
}
