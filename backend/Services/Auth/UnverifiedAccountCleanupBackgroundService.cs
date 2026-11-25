using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;

namespace TechForum.Api.Services;

// Chạy khi khởi động rồi mỗi ngày: xóa tài khoản không xác minh email sau EmailVerification:UnverifiedAccountDays ngày,
// để người đã đăng ký trước bằng email của người khác không giữ email đó mãi.
public sealed class UnverifiedAccountCleanupBackgroundService : BackgroundService
{
    private const int BatchSize = 100;

    private readonly IServiceScopeFactory scopeFactory;
    private readonly IOptions<EmailVerificationOptions> options;
    private readonly TimeProvider timeProvider;
    private readonly ILogger<UnverifiedAccountCleanupBackgroundService> logger;

    public UnverifiedAccountCleanupBackgroundService(
        IServiceScopeFactory scopeFactory,
        IOptions<EmailVerificationOptions> options,
        TimeProvider timeProvider,
        ILogger<UnverifiedAccountCleanupBackgroundService> logger)
    {
        this.scopeFactory = scopeFactory;
        this.options = options;
        this.timeProvider = timeProvider;
        this.logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromDays(1));
        do
        {
            await CleanupAsync(stoppingToken);
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    public async Task<int> CleanupAsync(CancellationToken cancellationToken)
    {
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var repository = scope.ServiceProvider.GetRequiredService<IUnverifiedAccountRepository>();
            var days = Math.Max(1, options.Value.UnverifiedAccountDays);
            var expired = await repository.GetExpiredAsync(timeProvider.GetUtcNow().AddDays(-days), BatchSize, cancellationToken);
            foreach (var userId in expired)
            {
                await repository.DeleteAsync(userId, cancellationToken);
            }
            if (expired.Count > 0)
            {
                logger.LogInformation("Đã xóa {Count} tài khoản không xác minh email sau {Days} ngày.", expired.Count, days);
            }
            return expired.Count;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return 0;
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Không dọn được tài khoản chưa xác minh email.");
            return 0;
        }
    }
}
