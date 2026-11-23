using TechForum.Api.Models;

namespace TechForum.Api.Services;

public interface ITokenService
{
    AccessTokenResult CreateAccessToken(ApplicationUser user, IReadOnlyList<string> roles);

    // DB chỉ lưu mã băm của giá trị này.
    string GenerateRefreshToken();

    string HashRefreshToken(string refreshToken);
}

public sealed record AccessTokenResult(string Token, DateTimeOffset ExpiresAtUtc);
