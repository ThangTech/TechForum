using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IRefreshTokenRepository
{
    Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken);

    Task<RefreshToken?> FindByHashAsync(string tokenHash, CancellationToken cancellationToken);

    // Revokes the current token and saves the new one in a single transaction.
    // Returns false when the current token was already used, revoked or expired,
    // for example when two requests try to refresh with the same token.
    Task<bool> RotateAsync(
        Guid currentTokenId,
        RefreshToken replacement,
        DateTimeOffset now,
        CancellationToken cancellationToken);

    Task RevokeByHashAsync(string tokenHash, DateTimeOffset now, CancellationToken cancellationToken);

    Task RevokeAllForUserAsync(string userId, DateTimeOffset now, CancellationToken cancellationToken);

    // Deletes the tokens whose expiry time is before `expiredBefore`. Returns the number of rows deleted.
    Task<int> DeleteExpiredAsync(DateTimeOffset expiredBefore, CancellationToken cancellationToken);
}
