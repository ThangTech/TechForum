using TechForum.Api.Data.Repositories;

namespace TechForum.Api.Services;

public sealed class RefreshTokenCleanupService : IRefreshTokenCleanupService
{
    private readonly IRefreshTokenRepository refreshTokenRepository;
    private readonly TimeProvider timeProvider;

    public RefreshTokenCleanupService(IRefreshTokenRepository refreshTokenRepository, TimeProvider timeProvider)
    {
        this.refreshTokenRepository = refreshTokenRepository;
        this.timeProvider = timeProvider;
    }

    // An expired token is already useless, but it is kept for a while so recent sign-ins can
    // still be looked up when something goes wrong.
    // A revoked token that has not expired yet is never deleted: it must stay in the table so
    // that using it again is noticed as a stolen token (see AuthService.RefreshAsync).
    public static readonly TimeSpan KeepAfterExpiry = TimeSpan.FromDays(30);

    public Task<int> DeleteExpiredAsync(CancellationToken cancellationToken)
    {
        return refreshTokenRepository.DeleteExpiredAsync(
            timeProvider.GetUtcNow() - KeepAfterExpiry,
            cancellationToken);
    }
}
