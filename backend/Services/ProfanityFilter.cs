using Microsoft.Extensions.Caching.Memory;

namespace TechForum.Api.Services;

// Keeps the banned words in IMemoryCache, so a post or an answer does not cost a query to the database.
// The list is read when the application starts (BannedWordWarmupService), after every change of an admin, and again
// when the cache entry runs out, so another instance of the API that changed the list is noticed within minutes.
public sealed class ProfanityFilter(
    IMemoryCache cache,
    IBannedWordLoader loader,
    ILogger<ProfanityFilter> logger) : IProfanityFilter
{
    public const string CacheKey = "banned-words:filter-set";

    private static readonly TimeSpan CacheLifetime = TimeSpan.FromMinutes(10);
    // When the database cannot be read, the filter lets the text pass and tries again soon, instead of asking for
    // every request.
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
