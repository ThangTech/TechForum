using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos.Auth;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class EmailVerificationService : IEmailVerificationService
{
    private const string InvalidLinkMessage = "Link xác minh không hợp lệ hoặc đã hết hạn. Hãy gửi lại email xác minh.";

    private readonly IAccountRepository accountRepository;
    private readonly IEmailSender emailSender;
    private readonly IOptions<RecoveryEmailOptions> emailOptions;
    private readonly ILogger<EmailVerificationService> logger;

    public EmailVerificationService(
        IAccountRepository accountRepository,
        IEmailSender emailSender,
        IOptions<RecoveryEmailOptions> emailOptions,
        ILogger<EmailVerificationService> logger)
    {
        this.accountRepository = accountRepository;
        this.emailSender = emailSender;
        this.emailOptions = emailOptions;
        this.logger = logger;
    }

    public async Task SendAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        if (user.EmailConfirmed || user.Email is null)
        {
            return;
        }
        if (!emailSender.IsConfigured || !emailOptions.Value.TryGetFrontendUrl(out var frontendUrl))
        {
            logger.LogWarning("Chưa cấu hình gửi email nên không gửi được email xác minh tài khoản.");
            return;
        }

        var token = await accountRepository.GenerateEmailConfirmationTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        // Token nằm sau dấu #, nên trình duyệt không gửi nó lên máy chủ hay theo Referer.
        var link = $"{frontendUrl}/verify-email#userId={Uri.EscapeDataString(user.Id)}&token={encodedToken}";
        try
        {
            await emailSender.SendAsync(user.Email, "Xác minh email tài khoản TechForum",
                $"Chào {user.DisplayName},\n\nMở liên kết sau trong vòng 24 giờ để xác minh email và bắt đầu đăng bài trên TechForum:\n" +
                $"{link}\n\nNếu bạn không tạo tài khoản này, hãy bỏ qua email; tài khoản chưa xác minh sẽ tự bị xóa sau vài ngày.",
                cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            // Không ghi token hay email vào log.
            logger.LogError(exception, "Không gửi được email xác minh. Kiểm tra cấu hình và kết nối SMTP.");
        }
    }

    public async Task<Result> ResendAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await accountRepository.FindByIdAsync(userId);
        if (user is null)
        {
            return Result.Fail(ErrorType.Unauthorized, "Bạn cần đăng nhập");
        }
        if (user.EmailConfirmed)
        {
            return Result.Fail(ErrorType.Conflict, "Email đã được xác minh");
        }
        if (!emailSender.IsConfigured || !emailOptions.Value.TryGetFrontendUrl(out _))
        {
            return Result.Fail(ErrorType.Unavailable, "Chưa gửi được email xác minh",
                "Máy chủ chưa được cấu hình gửi email. Vui lòng thử lại sau.");
        }

        await SendAsync(user, cancellationToken);
        return Result.Success();
    }

    public async Task<Result> ConfirmAsync(ConfirmEmailRequest request, CancellationToken cancellationToken)
    {
        string token;
        try
        {
            token = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(request.Token));
        }
        catch (FormatException)
        {
            return Result.Fail(ErrorType.Validation, "Không xác minh được email", InvalidLinkMessage, "token");
        }

        var user = await accountRepository.FindByIdAsync(request.UserId);
        if (user is null)
        {
            return Result.Fail(ErrorType.Validation, "Không xác minh được email", InvalidLinkMessage, "token");
        }
        if (user.EmailConfirmed)
        {
            return Result.Success();
        }

        var result = await accountRepository.ConfirmEmailAsync(user, token);
        if (!result.Succeeded)
        {
            return Result.Fail(ErrorType.Validation, "Không xác minh được email", InvalidLinkMessage, "token");
        }

        return Result.Success();
    }
}
