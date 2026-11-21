using TechForum.Api.Models;

namespace TechForum.Api.Services;

public interface ITokenService
{
    AccessTokenResult CreateAccessToken(ApplicationUser user, IReadOnlyList<string> roles);

    // Returns a new random refresh token value. Only its hash is saved in the database.
    string GenerateRefreshToken();

    string HashRefreshToken(string refreshToken);
}

public sealed record AccessTokenResult(string Token, DateTimeOffset ExpiresAtUtc);
