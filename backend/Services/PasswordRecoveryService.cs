using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos.Auth;

namespace TechForum.Api.Services;

public sealed class PasswordRecoveryService(
    IPasswordRecoveryRepository repository,
    IRecoveryEmailSender emailSender,
    IOptions<RecoveryEmailOptions> options,
    IHostEnvironment environment,
    ILogger<PasswordRecoveryService> logger) : IPasswordRecoveryService
{
    public async Task<bool> RequestAsync(string email, CancellationToken cancellationToken)
    {
        // URL lấy từ cấu hình tin cậy, không ghép từ Host header của request.
        if (!emailSender.IsConfigured || !TryGetFrontendUrl(out var frontendUrl)) return false;

        var user = await repository.FindByEmailAsync(email.Trim());
        if (user?.Email is null) return true;

        var token = await repository.GenerateTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        // Fragment không được trình duyệt gửi lên máy chủ hay theo Referer.
        var resetUrl = $"{frontendUrl}/reset-password#email={Uri.EscapeDataString(user.Email)}&token={encodedToken}";
        try
        {
            await emailSender.SendAsync(user.Email, resetUrl, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception)
        {
            // Không ghi token/email vào log và không tiết lộ tài khoản tồn tại khi SMTP lỗi.
            logger.LogError("Không thể gửi email khôi phục mật khẩu. Kiểm tra cấu hình và kết nối SMTP.");
        }
        return true;
    }

    public async Task<bool> ResetAsync(ResetPasswordRequest request)
    {
        string token;
        try
        {
            token = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(request.Token));
        }
        catch (FormatException)
        {
            return false;
        }
        var user = await repository.FindByEmailAsync(request.Email.Trim());
        if (user is null) return false;
        var result = await repository.ResetAsync(user, token, request.NewPassword);
        // Identity đổi SecurityStamp để vô hiệu cả token đã dùng lẫn phiên đăng nhập cũ.
        return result.Succeeded;
    }

    private bool TryGetFrontendUrl(out string frontendUrl)
    {
        frontendUrl = options.Value.FrontendUrl.TrimEnd('/');
        return Uri.TryCreate(frontendUrl, UriKind.Absolute, out var uri) &&
            string.IsNullOrEmpty(uri.UserInfo) && string.IsNullOrEmpty(uri.Query) &&
            string.IsNullOrEmpty(uri.Fragment) && uri.AbsolutePath == "/" &&
            (uri.Scheme == Uri.UriSchemeHttps || environment.IsDevelopment() &&
                uri.Scheme == Uri.UriSchemeHttp && uri.IsLoopback);
    }
}
