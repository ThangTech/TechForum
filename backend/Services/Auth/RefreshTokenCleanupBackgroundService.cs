namespace TechForum.Api.Services;

// Runs once at start-up and then every day, so the RefreshTokens table does not grow forever.
public sealed class RefreshTokenCleanupBackgroundService(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    ILogger<RefreshTokenCleanupBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var intervalHours = Math.Max(
            1,
            configuration.GetValue<int?>("RefreshTokens:CleanupIntervalHours") ?? 24);

        using var timer = new PeriodicTimer(TimeSpan.FromHours(intervalHours));
        do
        {
            await CleanupAsync(stoppingToken);
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task CleanupAsync(CancellationToken cancellationToken)
    {
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var cleanupService = scope.ServiceProvider.GetRequiredService<IRefreshTokenCleanupService>();
            var count = await cleanupService.DeleteExpiredAsync(cancellationToken);
            if (count > 0)
            {
                logger.LogInformation("Đã xóa {Count} refresh token đã hết hạn.", count);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // Ứng dụng đang dừng.
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Không thể dọn refresh token đã hết hạn.");
        }
    }
}
