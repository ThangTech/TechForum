namespace TechForum.Api.Services;

// Gửi email văn bản thường qua SMTP: email quên mật khẩu và email xác minh tài khoản.
public interface IEmailSender
{
    bool IsConfigured { get; }

    Task SendAsync(string to, string subject, string text, CancellationToken cancellationToken);
}
