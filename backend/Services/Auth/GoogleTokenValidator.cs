using Google.Apis.Auth;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;

namespace TechForum.Api.Services;

// Kiểm tra ID token mà nút "Đăng nhập bằng Google" trả về: chữ ký của Google, hạn dùng, và token phải cấp cho đúng
// Client ID của TechForum, để token của ứng dụng khác không dùng được ở đây.
public sealed class GoogleTokenValidator : IGoogleTokenValidator
{
    private readonly GoogleAuthOptions options;
    private readonly ILogger<GoogleTokenValidator> logger;

    public GoogleTokenValidator(IOptions<GoogleAuthOptions> options, ILogger<GoogleTokenValidator> logger)
    {
        this.options = options.Value;
        this.logger = logger;
    }

    public bool IsConfigured => options.IsConfigured;

    public async Task<GoogleIdentity?> ValidateAsync(string credential)
    {
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings { Audience = [options.ClientId] };
            var payload = await GoogleJsonWebSignature.ValidateAsync(credential, settings);
            return new GoogleIdentity(payload.Subject, payload.Email, payload.EmailVerified, payload.Name);
        }
        catch (InvalidJwtException exception)
        {
            logger.LogInformation("ID token Google không hợp lệ: {Reason}", exception.Message);
            return null;
        }
    }
}
