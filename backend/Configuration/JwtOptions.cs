using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace TechForum.Api.Configuration;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    // The signing key must be set by environment variable or user secrets in real deployments.
    public const int MinimumSigningKeyLength = 32;

    public string Issuer { get; init; } = "TechForum.Api";

    public string Audience { get; init; } = "TechForum.Web";

    public string SigningKey { get; init; } = string.Empty;

    public int AccessTokenMinutes { get; init; } = 15;

    // Used when the user ticks "remember me" at login.
    public int RefreshTokenDays { get; init; } = 7;

    // Used when the user does not tick "remember me".
    public int ShortRefreshTokenDays { get; init; } = 1;

    public string? GetConfigurationError()
    {
        if (string.IsNullOrWhiteSpace(SigningKey) || SigningKey.Length < MinimumSigningKeyLength)
        {
            return $"Jwt:SigningKey must be at least {MinimumSigningKeyLength} characters. " +
                "Set Jwt__SigningKey or add it to a local settings file.";
        }

        if (AccessTokenMinutes < 1 || RefreshTokenDays < 1 || ShortRefreshTokenDays < 1)
        {
            return "Jwt token lifetimes must be at least 1 minute or 1 day.";
        }

        return null;
    }

    public SymmetricSecurityKey CreateSecurityKey() =>
        new(Encoding.UTF8.GetBytes(SigningKey));

    // Shared by the JwtBearer middleware and the tests so both check tokens the same way.
    public TokenValidationParameters CreateValidationParameters() => new()
    {
        ValidateIssuer = true,
        ValidIssuer = Issuer,
        ValidateAudience = true,
        ValidAudience = Audience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = CreateSecurityKey(),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
}
