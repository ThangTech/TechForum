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

    // Token hết hạn được giữ thêm một thời gian để tra cứu khi có sự cố. Token đã thu hồi mà chưa hết hạn thì không xóa:
    // phải còn trong bảng để lần dùng lại bị phát hiện là token bị đánh cắp (xem AuthService.RefreshAsync).
    public static readonly TimeSpan KeepAfterExpiry = TimeSpan.FromDays(30);

    public Task<int> DeleteExpiredAsync(CancellationToken cancellationToken)
    {
        return refreshTokenRepository.DeleteExpiredAsync(
            timeProvider.GetUtcNow() - KeepAfterExpiry,
            cancellationToken);
    }
}
