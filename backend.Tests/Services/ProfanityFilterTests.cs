using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using TechForum.Api.Services;
using TechForum.Api.Tests.Fakes;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class ProfanityFilterTests
{
    private readonly FakeLoader loader = new() { Words = ["foobar"] };
    private readonly MemoryCache cache = new(new MemoryCacheOptions());
    private readonly CapturingLogger<ProfanityFilter> logger = new();

    private ProfanityFilter CreateFilter() => new(cache, loader, logger);

    [Fact]
    public async Task FilterAsync_ReadsTheWordsOnceAndKeepsThemInTheCache()
    {
        var filter = CreateFilter();

        Assert.Equal("a ***", await filter.FilterAsync("a foobar", false, default));
        Assert.Equal("b ***", await filter.FilterAsync("b foobar", false, default));
        Assert.Equal("c ***", await filter.FilterAsync("c foobar", true, default));

        Assert.Equal(1, loader.LoadCount);
    }

    [Fact]
    public async Task WarmUpAsync_FillsTheCacheSoThePostsDoNotQueryTheDatabase()
    {
        var filter = CreateFilter();

        await filter.WarmUpAsync(default);
        await filter.FilterAsync("a foobar", false, default);

        Assert.Equal(1, loader.LoadCount);
        Assert.True(cache.TryGetValue(ProfanityFilter.CacheKey, out _));
    }

    [Fact]
    public async Task Invalidate_MakesTheNextTextReadTheNewList()
    {
        var filter = CreateFilter();
        await filter.FilterAsync("x", false, default);
        loader.Words = ["foobar", "bazqux"];

        // Still the old list while the cache is valid.
        Assert.Equal("bazqux", await filter.FilterAsync("bazqux", false, default));

        filter.Invalidate();

        Assert.Equal("***", await filter.FilterAsync("bazqux", false, default));
        Assert.Equal(2, loader.LoadCount);
    }

    [Fact]
    public async Task WarmUpAsync_AfterAChange_ReplacesTheCachedList()
    {
        var filter = CreateFilter();
        await filter.WarmUpAsync(default);
        loader.Words = ["bazqux"];

        await filter.WarmUpAsync(default);

        Assert.Equal("foobar ***", await filter.FilterAsync("foobar bazqux", false, default));
    }

    [Fact]
    public async Task FilterAsync_WhenTheDatabaseFails_LetsTheTextPassLogsAndDoesNotAskAgainAtOnce()
    {
        loader.Fails = true;
        var filter = CreateFilter();

        Assert.Equal("a foobar", await filter.FilterAsync("a foobar", false, default));
        Assert.Equal("b foobar", await filter.FilterAsync("b foobar", false, default));

        Assert.Equal(1, loader.LoadCount);
        Assert.Contains(logger.Entries, entry => entry.Level == LogLevel.Error);
    }

    [Fact]
    public async Task FilterAsync_WithAnEmptyTextDoesNotTouchTheCache()
    {
        var filter = CreateFilter();

        Assert.Equal("", await filter.FilterAsync("", false, default));

        Assert.Equal(0, loader.LoadCount);
    }

    private sealed class FakeLoader : IBannedWordLoader
    {
        public IReadOnlyList<string> Words { get; set; } = [];
        public bool Fails { get; set; }
        public int LoadCount { get; private set; }

        public Task<IReadOnlyList<string>> LoadAsync(CancellationToken cancellationToken)
        {
            LoadCount++;
            if (Fails) throw new InvalidOperationException("The database is not ready.");
            return Task.FromResult(Words);
        }
    }
}
