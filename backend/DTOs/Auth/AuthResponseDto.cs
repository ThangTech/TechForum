namespace TechForum.Api.Dtos.Auth;

// Refresh token không nằm ở đây mà gửi trong cookie HttpOnly.
public sealed record AuthResponseDto(
    CurrentUserDto User,
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAtUtc);
