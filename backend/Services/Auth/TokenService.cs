using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using TechForum.Api.Configuration;
using TechForum.Api.Constants;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class TokenService(
    IOptions<JwtOptions> options,
    TimeProvider timeProvider) : ITokenService
{
    private const int RefreshTokenByteCount = 32;

    private readonly JwtOptions jwtOptions = options.Value;

    public AccessTokenResult CreateAccessToken(ApplicationUser user, IReadOnlyList<string> roles)
    {
        var now = timeProvider.GetUtcNow();
        var expiresAt = now.AddMinutes(jwtOptions.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new(AuthClaimTypes.SecurityStamp, user.SecurityStamp ?? string.Empty)
        };
        foreach (var role in roles)
        {
            claims.Add(new Claim("role", role));
        }

        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = jwtOptions.Issuer,
            Audience = jwtOptions.Audience,
            Subject = new ClaimsIdentity(claims),
            IssuedAt = now.UtcDateTime,
            NotBefore = now.UtcDateTime,
            Expires = expiresAt.UtcDateTime,
            SigningCredentials = new SigningCredentials(
                jwtOptions.CreateSecurityKey(),
                SecurityAlgorithms.HmacSha256)
        };

        var token = new JsonWebTokenHandler().CreateToken(descriptor);
        return new AccessTokenResult(token, expiresAt);
    }

    public string GenerateRefreshToken() =>
        WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(RefreshTokenByteCount));

    public string HashRefreshToken(string refreshToken)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToHexStringLower(hash);
    }
}
