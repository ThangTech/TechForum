using TechForum.Api.Data.Repositories;

namespace TechForum.Api.Services;

// Chạy một lần khi API khởi động: điền văn bản tìm kiếm cho bài có từ trước khi có cột SearchText (và bài mẫu).
// Chạy nền theo từng đợt nhỏ để không làm chậm lúc khởi động; lỗi chỉ ghi log, lần khởi động sau làm tiếp.
public sealed class TopicSearchBackfillService : BackgroundService
{
    private const int BatchSize = 100;

    private readonly IServiceScopeFactory scopeFactory;
    private readonly ILogger<TopicSearchBackfillService> logger;

    public TopicSearchBackfillService(IServiceScopeFactory scopeFactory, ILogger<TopicSearchBackfillService> logger)
    {
        this.scopeFactory = scopeFactory;
        this.logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            var filled = 0;
            while (!stoppingToken.IsCancellationRequested)
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var repository = scope.ServiceProvider.GetRequiredService<ITopicSearchBackfillRepository>();
                var topics = await repository.GetWithoutSearchTextAsync(BatchSize, stoppingToken);
                if (topics.Count == 0)
                {
                    break;
                }
                foreach (var topic in topics)
                {
                    // Bài rỗng vẫn có giá trị khác rỗng để không bị lấy lại mãi.
                    var text = TopicSearchText.Build(topic.Title, topic.Summary, topic.BodyHtml);
                    topic.SearchText = text.Length > 0 ? text : " ";
                }
                await repository.SaveChangesAsync(stoppingToken);
                filled += topics.Count;
            }
            if (filled > 0)
            {
                logger.LogInformation("Đã tạo văn bản tìm kiếm cho {Count} bài.", filled);
            }
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogWarning(exception, "Chưa tạo xong văn bản tìm kiếm cho các bài cũ; sẽ làm tiếp ở lần khởi động sau.");
        }
    }
}
