using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class TopicServiceTests
{
    [Fact]
    public async Task GetPublicPageAsync_MapsStableContractAndPagination()
    {
        var repository = new FakeTopicRepository
        {
            Page = new TopicPage([CreateTopic()], 11)
        };
        var service = new TopicService(repository);
        var query = new TopicQuery { Page = 2, PageSize = 5, Type = TopicType.Question };

        var result = await service.GetPublicPageAsync(query, CancellationToken.None);

        Assert.Equal(2, result.Page);
        Assert.Equal(5, result.PageSize);
        Assert.Equal(11, result.TotalItems);
        Assert.Equal(3, result.TotalPages);
        var item = Assert.Single(result.Items);
        Assert.Equal("question", item.Type);
        Assert.Equal("ASP.NET Core", item.Tags[0].Name);
        Assert.Equal("TypeScript", item.Tags[1].Name);
        Assert.Same(query, repository.LastQuery);
    }

    [Fact]
    public async Task GetPublicPageAsync_WhenEmpty_ReturnsZeroTotalPages()
    {
        var repository = new FakeTopicRepository();
        var service = new TopicService(repository);

        var result = await service.GetPublicPageAsync(new TopicQuery(), CancellationToken.None);

        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalItems);
        Assert.Equal(0, result.TotalPages);
    }

    private static Topic CreateTopic()
    {
        var aspNet = new Tag { Id = 1, Name = "ASP.NET Core", Slug = "aspnet-core" };
        var typeScript = new Tag { Id = 2, Name = "TypeScript", Slug = "typescript" };
        return new Topic
        {
            Id = 10,
            Title = "Câu hỏi kiểm thử",
            Slug = "cau-hoi-kiem-thu",
            Summary = "Tóm tắt",
            BodyHtml = "<p>Nội dung</p>",
            Type = TopicType.Question,
            Status = TopicStatus.Published,
            Category = new Category { Id = 1, Name = "Lập trình", Slug = "lap-trinh" },
            AuthorId = "member-a",
            Author = new ApplicationUser
            {
                Id = "member-a",
                DisplayName = "Thành viên A",
                UserName = "member.a@techforum.local",
                CreatedAtUtc = DateTimeOffset.UtcNow
            },
            CreatedAtUtc = DateTimeOffset.UtcNow,
            PublishedAtUtc = DateTimeOffset.UtcNow,
            TopicTags =
            [
                new TopicTag { TagId = typeScript.Id, Tag = typeScript },
                new TopicTag { TagId = aspNet.Id, Tag = aspNet }
            ]
        };
    }

    private sealed class FakeTopicRepository : ITopicRepository
    {
        public TopicPage Page { get; init; } = new([], 0);
        public TopicQuery? LastQuery { get; private set; }

        public Task<TopicPage> GetPublicPageAsync(
            TopicQuery query,
            CancellationToken cancellationToken)
        {
            LastQuery = query;
            return Task.FromResult(Page);
        }

        public Task<Topic?> GetPublicByIdAsync(int id, CancellationToken cancellationToken) =>
            Task.FromResult(Page.Items.SingleOrDefault(topic => topic.Id == id));
    }
}
