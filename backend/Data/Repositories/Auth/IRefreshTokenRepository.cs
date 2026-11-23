using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IRefreshTokenRepository
{
    Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken);

    Task<RefreshToken?> FindByHashAsync(string tokenHash, CancellationToken cancellationToken);

    // Thu hồi token cũ và lưu token mới trong một giao dịch. Trả false khi token cũ đã dùng, bị thu hồi
    // hoặc hết hạn, ví dụ hai yêu cầu cùng làm mới bằng một token.
    Task<bool> RotateAsync(
        Guid currentTokenId,
        RefreshToken replacement,
        DateTimeOffset now,
        CancellationToken cancellationToken);

    Task RevokeByHashAsync(string tokenHash, DateTimeOffset now, CancellationToken cancellationToken);

    Task RevokeAllForUserAsync(string userId, DateTimeOffset now, CancellationToken cancellationToken);

    Task<int> DeleteExpiredAsync(DateTimeOffset expiredBefore, CancellationToken cancellationToken);
}
