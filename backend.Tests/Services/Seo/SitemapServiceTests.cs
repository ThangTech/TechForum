using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class SitemapServiceTests
{
    [Fact]
    public async Task BuildAsync_ListsTheMainPagesAndEveryPublicTopicOnTheSite()
    {
        var topicId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        var repository = new FakeSitemapRepository([new SitemapTopic(topicId, new DateTimeOffset(2026, 11, 20, 23, 0, 0, TimeSpan.FromHours(-2)))]);
        var service = CreateService(repository, "https://www.forum.example/");

        var result = await service.BuildAsync(CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.StartsWith("<?xml version=\"1.0\" encoding=\"utf-8\"?>", result.Value);
        Assert.Contains("<loc>https://www.forum.example/</loc>", result.Value);
        Assert.Contains("<loc>https://www.forum.example/questions</loc>", result.Value);
        Assert.Contains("<loc>https://www.forum.example/privacy</loc>", result.Value);
        Assert.Contains($"<loc>https://www.forum.example/topics/{topicId}</loc>", result.Value);
        // Ngày sửa tính theo giờ UTC.
        Assert.Contains("<lastmod>2026-11-21</lastmod>", result.Value);
        Assert.Equal(5000, repository.RequestedCount);
    }

    [Fact]
    public async Task BuildAsync_WithoutTheSiteAddress_IsUnavailable()
    {
        var service = CreateService(new FakeSitemapRepository([]), string.Empty);

        var result = await service.BuildAsync(CancellationToken.None);

        Assert.Equal(ErrorType.Unavailable, result.Error);
    }

    private static SitemapService CreateService(ISitemapRepository repository, string frontendUrl)
    {
        return new SitemapService(repository, Options.Create(new RecoveryEmailOptions { FrontendUrl = frontendUrl }));
    }

    private sealed class FakeSitemapRepository : ISitemapRepository
    {
        private readonly IReadOnlyList<SitemapTopic> topics;

        public FakeSitemapRepository(IReadOnlyList<SitemapTopic> topics)
        {
            this.topics = topics;
        }

        public int RequestedCount { get; private set; }

        public Task<IReadOnlyList<SitemapTopic>> GetPublicTopicsAsync(int maxCount, CancellationToken cancellationToken)
        {
            RequestedCount = maxCount;
            return Task.FromResult(topics);
        }
    }
}
