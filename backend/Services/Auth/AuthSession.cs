using TechForum.Api.Dtos.Auth;

namespace TechForum.Api.Services;

// Phiên đăng nhập sau khi đăng ký, đăng nhập hoặc làm mới token.
public sealed record AuthSession(CurrentUserDto User, AuthTokens Tokens);

public sealed record AuthTokens(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAtUtc,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAtUtc);
