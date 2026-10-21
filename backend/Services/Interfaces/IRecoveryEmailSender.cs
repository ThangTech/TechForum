namespace TechForum.Api.Services;

public interface IRecoveryEmailSender
{
    bool IsConfigured { get; }
    Task SendAsync(string email, string resetUrl, CancellationToken cancellationToken);
}
