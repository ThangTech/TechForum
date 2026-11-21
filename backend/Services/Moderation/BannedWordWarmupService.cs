namespace TechForum.Api.Services;

// When the application starts: first it fills an empty table of banned words from the local list file (the file is not
// in Git, see .gitignore), then it reads the table into the cache, so the first post does not wait for it.
// Neither step can stop the application from starting: a problem is written to the log.
public sealed class BannedWordWarmupService(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    IHostEnvironment environment,
    IProfanityFilter profanityFilter,
    ILogger<BannedWordWarmupService> logger) : IHostedService
{
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
            // The path can be changed with BannedWords:SeedFile, for example on a server.
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
