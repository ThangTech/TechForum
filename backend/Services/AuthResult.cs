using TechForum.Api.Dtos.Auth;
using TechForum.Api.Enums;

namespace TechForum.Api.Services;

public sealed record AuthResult(
    CurrentUserDto? User,
    AuthTokens? Tokens,
    AuthFailureKind Failure,
    IReadOnlyDictionary<string, string[]> Errors)
{
    public bool Succeeded => User is not null && Failure == AuthFailureKind.None;

    // Tokens are only set by register, login and refresh.
    public static AuthResult Success(CurrentUserDto user, AuthTokens? tokens = null) =>
        new(user, tokens, AuthFailureKind.None, new Dictionary<string, string[]>());

    public static AuthResult Failed(
        AuthFailureKind failure,
        IReadOnlyDictionary<string, string[]>? errors = null) =>
        new(null, null, failure, errors ?? new Dictionary<string, string[]>());
}

public sealed record AuthTokens(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAtUtc,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAtUtc);
