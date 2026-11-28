namespace TechForum.Api.Services;

public sealed class MediaCleanupBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory scopeFactory;
    private readonly IConfiguration configuration;
    private readonly ILogger<MediaCleanupBackgroundService> logger;

    public MediaCleanupBackgroundService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<MediaCleanupBackgroundService> logger)
    {
        this.scopeFactory = scopeFactory;
        this.configuration = configuration;
        this.logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Mặc định mỗi ngày một lần, cùng nhịp với các tác vụ dọn dẹp khác: Azure SQL gói miễn phí chỉ tự ngủ khi không
        // có truy vấn trong khoảng một giờ, chạy mỗi giờ sẽ giữ database thức suốt ngày và tiêu hết hạn mức vCore.
        var intervalMinutes = Math.Max(
            1,
            configuration.GetValue<int?>("Media:CleanupIntervalMinutes") ?? 1440);

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
