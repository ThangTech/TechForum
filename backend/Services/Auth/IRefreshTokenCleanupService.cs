namespace TechForum.Api.Services;

public interface IRefreshTokenCleanupService
{
    Task<int> DeleteExpiredAsync(CancellationToken cancellationToken);
}
