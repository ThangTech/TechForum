using Microsoft.Extensions.Caching.Memory;

namespace TechForum.Api.Services;

// Giữ từ cấm trong IMemoryCache để mỗi bài đăng không tốn một truy vấn. Danh sách được đọc lại khi khởi động,
// sau mỗi lần quản trị viên sửa, và khi cache hết hạn, nên thay đổi từ instance API khác cũng có hiệu lực sau vài phút.
public sealed class ProfanityFilter : IProfanityFilter
{
    public const string CacheKey = "banned-words:filter-set";
    private static readonly TimeSpan CacheLifetime = TimeSpan.FromMinutes(10);

    private readonly IMemoryCache cache;
    private readonly IBannedWordLoader loader;
    private readonly ILogger<ProfanityFilter> logger;

    public ProfanityFilter(IMemoryCache cache, IBannedWordLoader loader, ILogger<ProfanityFilter> logger)
    {
        this.cache = cache;
        this.loader = loader;
        this.logger = logger;
    }

    // Không đọc được DB thì cho văn bản qua và thử lại sau ít phút, thay vì hỏi DB ở mọi yêu cầu.
    private static readonly TimeSpan FailureLifetime = TimeSpan.FromMinutes(1);

    public async Task<string> FilterAsync(string text, bool isHtml, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(text)) return text;
        var set = await GetSetAsync(cancellationToken);
        return set.Apply(text, isHtml);
    }

    public async Task WarmUpAsync(CancellationToken cancellationToken)
    {
        cache.Remove(CacheKey);
        await GetSetAsync(cancellationToken);
    }

    public void Invalidate() => cache.Remove(CacheKey);

    private async Task<ProfanityFilterSet> GetSetAsync(CancellationToken cancellationToken)
    {
        if (cache.TryGetValue(CacheKey, out ProfanityFilterSet? cached) && cached is not null) return cached;

        try
        {
            var words = await loader.LoadAsync(cancellationToken);
            var set = new ProfanityFilterSet(words);
            cache.Set(CacheKey, set, CacheLifetime);
            logger.LogInformation("Đã nạp {Count} từ cấm vào bộ nhớ đệm.", set.WordCount);
            return set;
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogError(exception, "Không đọc được danh sách từ cấm; tạm thời không lọc từ ngữ.");
            var empty = new ProfanityFilterSet([]);
            cache.Set(CacheKey, empty, FailureLifetime);
            return empty;
        }
    }
}
