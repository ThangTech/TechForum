using TechForum.Api.Data.Repositories;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class PublicStatisticsServiceTests
{
    [Fact]
    public async Task Get_ReturnsCountsFromRepository()
    {
        var service = new PublicStatisticsService(new FakeRepository(new PublicStatisticsData(12, 30, 18)));

        var result = await service.GetAsync(CancellationToken.None);

        Assert.Equal(12, result.MemberCount);
        Assert.Equal(30, result.ArticleCount);
        Assert.Equal(18, result.QuestionCount);
    }

    private sealed class FakeRepository(PublicStatisticsData data) : IPublicStatisticsRepository
    {
        public Task<PublicStatisticsData> GetAsync(CancellationToken cancellationToken) => Task.FromResult(data);
    }
}
