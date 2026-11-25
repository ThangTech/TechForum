using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using TechForum.Api.Configuration;

namespace TechForum.Api.Services;

public sealed class EmailSender : IEmailSender
{
    private readonly RecoveryEmailOptions settings;

    public EmailSender(IOptions<RecoveryEmailOptions> options)
    {
        settings = options.Value;
    }

    // Không mã hóa chỉ được phép với máy chủ mail trên chính máy này hoặc Mailpit (hộp thư giả trong Docker).
    public bool IsConfigured => !string.IsNullOrWhiteSpace(settings.Host) &&
        settings.Port > 0 && settings.Port <= 65535 &&
        MailboxAddress.TryParse(settings.FromAddress, out _) &&
        (settings.UseTls || IsLocalMailHost(settings.Host));

    private static bool IsLocalMailHost(string? host)
    {
        return host == "localhost" || host == "127.0.0.1" || host == "::1" || host == "mailpit";
    }

    public async Task SendAsync(string to, string subject, string text, CancellationToken cancellationToken)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("TechForum", settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;
        message.Body = new TextPart("plain") { Text = text };

        using var client = new SmtpClient { Timeout = 10000 };
        var security = settings.UseTls ? SecureSocketOptions.StartTls : SecureSocketOptions.None;
        if (settings.UseTls && settings.Port == 465)
        {
            security = SecureSocketOptions.SslOnConnect;
        }
        await client.ConnectAsync(settings.Host, settings.Port, security, cancellationToken);
        if (!string.IsNullOrWhiteSpace(settings.Username))
        {
            await client.AuthenticateAsync(settings.Username, settings.Password, cancellationToken);
        }
        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }
}
