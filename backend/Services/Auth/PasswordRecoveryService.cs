using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos.Auth;

namespace TechForum.Api.Services;

public sealed class PasswordRecoveryService : IPasswordRecoveryService
{
    private readonly IPasswordRecoveryRepository repository;
    private readonly IRefreshTokenRepository refreshTokenRepository;
    private readonly IEmailSender emailSender;
    private readonly IOptions<RecoveryEmailOptions> options;
    private readonly TimeProvider timeProvider;
    private readonly ILogger<PasswordRecoveryService> logger;

    public PasswordRecoveryService(
        IPasswordRecoveryRepository repository,
        IRefreshTokenRepository refreshTokenRepository,
        IEmailSender emailSender,
        IOptions<RecoveryEmailOptions> options,
        TimeProvider timeProvider,
        ILogger<PasswordRecoveryService> logger)
    {
        this.repository = repository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.emailSender = emailSender;
        this.options = options;
        this.timeProvider = timeProvider;
        this.logger = logger;
    }

    public async Task<bool> RequestAsync(string email, CancellationToken cancellationToken)
    {
        // URL lấy từ cấu hình tin cậy, không ghép từ Host header của request.
        if (!emailSender.IsConfigured || !options.Value.TryGetFrontendUrl(out var frontendUrl))
        {
            return false;
        }

        var user = await repository.FindByEmailAsync(email.Trim());
        if (user?.Email is null)
        {
            return true;
        }

        var token = await repository.GenerateTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        // Fragment không được trình duyệt gửi lên máy chủ hay theo Referer.
        var resetUrl = $"{frontendUrl}/reset-password#email={Uri.EscapeDataString(user.Email)}&token={encodedToken}";
        try
        {
            await emailSender.SendAsync(user.Email, "Đặt lại mật khẩu TechForum",
                $"Bạn đã yêu cầu đặt lại mật khẩu TechForum.\n\nMở liên kết sau trong vòng 30 phút:\n{resetUrl}\n\n" +
                "Liên kết chỉ dùng một lần. Nếu không gửi yêu cầu này, bạn có thể bỏ qua email.",
                EmailTemplate.Action(user.DisplayName,
                    "Bạn vừa yêu cầu đặt lại mật khẩu TechForum. Bấm nút bên dưới trong vòng 30 phút để chọn mật khẩu mới.",
                    "Đặt lại mật khẩu", resetUrl,
                    "Liên kết chỉ dùng một lần. Nếu bạn không gửi yêu cầu này, hãy bỏ qua email; mật khẩu của bạn không đổi.",
                    options.Value.ReplyToAddress),
                cancellationToken);
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

    public async Task<bool> ResetAsync(ResetPasswordRequest request, CancellationToken cancellationToken)
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
        if (user is null)
        {
            return false;
        }
        var result = await repository.ResetAsync(user, token, request.NewPassword);
        if (!result.Succeeded)
        {
            return false;
        }

        // Link đặt lại mật khẩu được gửi tới chính email này, nên người mở được nó là chủ email.
        await repository.MarkEmailConfirmedAsync(user);

        // Identity đổi SecurityStamp nên access token cũ hết hiệu lực.
        // Thu hồi refresh token để các thiết bị khác không tự đăng nhập lại.
        await refreshTokenRepository.RevokeAllForUserAsync(
            user.Id,
            timeProvider.GetUtcNow(),
            cancellationToken);
        return true;
    }
}
