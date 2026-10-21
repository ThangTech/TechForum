using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using TechForum.Api.Configuration;

namespace TechForum.Api.Services;

public sealed class RecoveryEmailSender(
    IOptions<RecoveryEmailOptions> options,
    IHostEnvironment environment) : IRecoveryEmailSender
{
    private readonly RecoveryEmailOptions settings = options.Value;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(settings.Host) &&
        settings.Port is > 0 and <= 65535 &&
        MailboxAddress.TryParse(settings.FromAddress, out _) &&
        (settings.UseTls || environment.IsDevelopment() &&
            settings.Host is "localhost" or "127.0.0.1" or "::1");

    public async Task SendAsync(string email, string resetUrl, CancellationToken cancellationToken)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("TechForum", settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(email));
        message.Subject = "Đặt lại mật khẩu TechForum";
        message.Body = new TextPart("plain")
        {
            Text = $"Bạn đã yêu cầu đặt lại mật khẩu TechForum.\n\nMở liên kết sau trong vòng 30 phút:\n{resetUrl}\n\nLiên kết chỉ dùng một lần. Nếu không gửi yêu cầu này, bạn có thể bỏ qua email."
        };

        using var client = new SmtpClient { Timeout = 10000 };
        var security = settings.UseTls ? SecureSocketOptions.StartTls : SecureSocketOptions.None;
        if (settings.UseTls && settings.Port == 465) security = SecureSocketOptions.SslOnConnect;
        await client.ConnectAsync(settings.Host, settings.Port, security, cancellationToken);
        if (!string.IsNullOrWhiteSpace(settings.Username))
        {
            await client.AuthenticateAsync(settings.Username, settings.Password, cancellationToken);
        }
        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }
}
