using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace TechForum.Api.Configuration;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    // Khóa ký phải đặt bằng biến môi trường hoặc user-secrets khi chạy thật.
    public const int MinimumSigningKeyLength = 32;

    public string Issuer { get; init; } = "TechForum.Api";

    public string Audience { get; init; } = "TechForum.Web";

    public string SigningKey { get; init; } = string.Empty;

    public int AccessTokenMinutes { get; init; } = 15;

    // Dùng khi người dùng chọn "Duy trì đăng nhập" (và đăng nhập Google). Mỗi lần làm mới phiên lại tính lại từ đầu.
    public int RefreshTokenDays { get; init; } = 30;

    // Dùng khi người dùng không chọn "ghi nhớ đăng nhập".
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

    public SymmetricSecurityKey CreateSecurityKey()
    {
        return new(Encoding.UTF8.GetBytes(SigningKey));
    }

    // Dùng chung cho JwtBearer và test, để hai nơi kiểm tra token giống hệt nhau.
    public TokenValidationParameters CreateValidationParameters()
    {
        return new()
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
}
