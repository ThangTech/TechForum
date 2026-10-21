using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Controllers;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class RelatedTopicServiceTests
{
    [Fact]
    public async Task GetPublicRelatedAsync_WhenSourceUnavailable_ReturnsNull()
    {
        var service = new RelatedTopicService(new FakeRepository());

        Assert.Null(await service.GetPublicRelatedAsync(1, CancellationToken.None));
    }

    [Fact]
    public async Task GetPublicRelatedAsync_WithNoMatches_ReturnsEmptyList()
    {
        var service = new RelatedTopicService(new FakeRepository { Items = [] });

        Assert.Empty((await service.GetPublicRelatedAsync(1, CancellationToken.None))!);
    }

    [Theory]
    [InlineData(TopicType.Article, "article")]
    [InlineData(TopicType.Question, "question")]
    public async Task GetPublicRelatedAsync_MapsPublicPreviewAndRequestsFourItems(TopicType type, string expectedType)
    {
        var publishedAt = new DateTimeOffset(2026, 10, 21, 1, 0, 0, TimeSpan.Zero);
        var repository = new FakeRepository
        {
            Items = [new RelatedTopicData(2, "Nội dung liên quan", "Tóm tắt công khai", type,
                3, "Frontend", "frontend", "member", "Thành viên", publishedAt, 2, true)]
        };
        var service = new RelatedTopicService(repository);

        var result = Assert.Single((await service.GetPublicRelatedAsync(1, CancellationToken.None))!);

        Assert.Equal(4, repository.RequestedLimit);
        Assert.Equal(1, repository.RequestedTopicId);
        Assert.Equal(expectedType, result.Type);
        Assert.Equal(new TopicCategoryDto(3, "Frontend", "frontend"), result.Category);
        Assert.Equal(new TopicAuthorDto("member", "Thành viên"), result.Author);
        Assert.Equal(publishedAt, result.PublishedAtUtc);
        Assert.Equal(2, result.SharedTagCount);
        Assert.True(result.IsSameCategory);
    }

    [Fact]
    public async Task Controller_WhenSourceUnavailable_ReturnsNotFoundProblem()
    {
        var controller = new RelatedTopicsController(new RelatedTopicService(new FakeRepository()));

        var response = await controller.Get(1, CancellationToken.None);

        var result = Assert.IsType<NotFoundObjectResult>(response.Result);
        Assert.Equal(404, Assert.IsType<ProblemDetails>(result.Value).Status);
    }

    private sealed class FakeRepository : IRelatedTopicRepository
    {
        public IReadOnlyList<RelatedTopicData>? Items { get; init; }
        public int RequestedTopicId { get; private set; }
        public int RequestedLimit { get; private set; }

        public Task<IReadOnlyList<RelatedTopicData>?> GetPublicRelatedAsync(
            int topicId, int limit, CancellationToken cancellationToken)
        {
            RequestedTopicId = topicId;
            RequestedLimit = limit;
            return Task.FromResult(Items);
        }
    }
}
