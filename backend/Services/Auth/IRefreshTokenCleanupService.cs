namespace TechForum.Api.Services;

public interface IRefreshTokenCleanupService
{
    // Deletes refresh tokens that expired a while ago. Returns how many rows were deleted.
    Task<int> DeleteExpiredAsync(CancellationToken cancellationToken);
}
