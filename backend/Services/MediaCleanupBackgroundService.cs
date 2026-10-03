namespace TechForum.Api.Services;

public sealed class MediaCleanupBackgroundService(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    ILogger<MediaCleanupBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var intervalMinutes = Math.Max(
            1,
            configuration.GetValue<int?>("Media:CleanupIntervalMinutes") ?? 60);

        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(intervalMinutes));
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
            var storage = scope.ServiceProvider.GetRequiredService<IMediaStorageService>();
            var count = await storage.CleanupOrphansAsync(cancellationToken);
            if (count > 0)
            {
                logger.LogInformation("Đã dọn {Count} media chưa được gắn vào nội dung.", count);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // Ứng dụng đang dừng.
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Không thể dọn media chưa được sử dụng.");
        }
    }
}
