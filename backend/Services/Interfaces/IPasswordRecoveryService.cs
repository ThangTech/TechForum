using TechForum.Api.Dtos.Auth;

namespace TechForum.Api.Services;

public interface IPasswordRecoveryService
{
    Task<bool> RequestAsync(string email, CancellationToken cancellationToken);
    Task<bool> ResetAsync(ResetPasswordRequest request);
}
