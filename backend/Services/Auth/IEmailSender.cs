namespace TechForum.Api.Services;

// Gửi email qua SMTP (email quên mật khẩu, xác minh tài khoản): bản chữ thường, kèm bản HTML nếu có.
public interface IEmailSender
{
    bool IsConfigured { get; }

    Task SendAsync(string to, string subject, string text, string? html, CancellationToken cancellationToken);
}
