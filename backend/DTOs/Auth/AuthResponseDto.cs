namespace TechForum.Api.Dtos.Auth;

// The refresh token is not part of this response. It is sent in an HttpOnly cookie.
public sealed record AuthResponseDto(
    CurrentUserDto User,
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAtUtc);
