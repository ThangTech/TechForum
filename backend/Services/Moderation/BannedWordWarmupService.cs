namespace TechForum.Api.Services;

// Khi khởi động: nạp bảng từ cấm còn trống từ file trên máy (file không có trong Git), rồi đọc bảng vào cache
// để bài đăng đầu tiên không phải chờ. Lỗi ở bước nào cũng chỉ ghi log, không làm ứng dụng dừng.
public sealed class BannedWordWarmupService : IHostedService
{
    private readonly IServiceScopeFactory scopeFactory;
    private readonly IConfiguration configuration;
    private readonly IHostEnvironment environment;
    private readonly IProfanityFilter profanityFilter;
    private readonly ILogger<BannedWordWarmupService> logger;

    public BannedWordWarmupService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        IHostEnvironment environment,
        IProfanityFilter profanityFilter,
        ILogger<BannedWordWarmupService> logger)
    {
        this.scopeFactory = scopeFactory;
        this.configuration = configuration;
        this.environment = environment;
        this.profanityFilter = profanityFilter;
        this.logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await SeedFromFileAsync(cancellationToken);
        await profanityFilter.WarmUpAsync(cancellationToken);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private async Task SeedFromFileAsync(CancellationToken cancellationToken)
    {
        try
        {
            // Đổi đường dẫn bằng BannedWords:SeedFile, ví dụ khi chạy trên server.
            var path = configuration["BannedWords:SeedFile"]
                ?? Path.Combine(environment.ContentRootPath, "Data", "Seed", "banned-words.txt");
            if (!File.Exists(path))
            {
                logger.LogDebug("Không có file danh sách từ cấm {Path}; bảng chỉ có các từ đã nhập ở trang quản trị.", path);
                return;
            }

            var lines = await File.ReadAllLinesAsync(path, cancellationToken);
            await using var scope = scopeFactory.CreateAsyncScope();
            await scope.ServiceProvider.GetRequiredService<IBannedWordSeeder>().SeedIfEmptyAsync(lines, cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogError(exception, "Không nạp được danh sách từ cấm từ file.");
        }
    }
}
