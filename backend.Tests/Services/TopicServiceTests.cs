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
        var service = CreateService(repository);
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
        var service = CreateService(repository);

        var result = await service.GetPublicPageAsync(new TopicQuery(), CancellationToken.None);

        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalItems);
        Assert.Equal(0, result.TotalPages);
    }

    [Fact]
    public async Task CreateAsync_WithValidRequest_SanitizesAndBuildsOwnedContract()
    {
        var repository = new FakeTopicRepository
        {
            Category = new Category { Id = 2, Name = "Web & Mobile", Slug = "web-mobile" },
            Tags = [new Tag { Id = 4, Name = "TypeScript", Slug = "typescript", IsActive = true }]
        };
        var service = CreateService(repository);
        var request = new CreateTopicRequest(
            "Bắt đầu TypeScript an toàn",
            "Tóm tắt hợp lệ có nhiều hơn hai mươi ký tự.",
            "<p onclick=\"alert(1)\">Nội dung hữu ích</p><script>alert(1)</script>",
            "article",
            2,
            [4],
            true);

        var result = await service.CreateAsync("member-a", request, CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.NotNull(result.Topic);
        Assert.Equal(99, result.Topic.Id);
        Assert.Equal("published", result.Topic.Status);
        Assert.Equal("bat-dau-typescript-an-toan", result.Topic.Slug);
        Assert.DoesNotContain("onclick", result.Topic.BodyHtml, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("<script", result.Topic.BodyHtml, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("member-a", repository.AddedTopic?.AuthorId);
    }

    [Fact]
    public async Task CreateAsync_WithUnknownCategory_ReturnsFieldErrorWithoutSaving()
    {
        var repository = new FakeTopicRepository();
        var service = CreateService(repository);
        var request = new CreateTopicRequest(
            "Tiêu đề đủ độ dài",
            "Tóm tắt hợp lệ có nhiều hơn hai mươi ký tự.",
            "<p>Nội dung hợp lệ.</p>",
            "question",
            999,
            [],
            false);

        var result = await service.CreateAsync("member-a", request, CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Contains("categoryId", result.Errors.Keys);
        Assert.Null(repository.AddedTopic);
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

    private static TopicService CreateService(FakeTopicRepository repository) =>
        new(repository, new ContentSanitizer(), TimeProvider.System);

    private sealed class FakeTopicRepository : ITopicRepository
    {
        public TopicPage Page { get; init; } = new([], 0);
        public TopicQuery? LastQuery { get; private set; }
        public Category? Category { get; init; }
        public IReadOnlyList<Tag> Tags { get; init; } = [];
        public Topic? AddedTopic { get; private set; }

        public Task<TopicPage> GetPublicPageAsync(
            TopicQuery query,
            CancellationToken cancellationToken)
        {
            LastQuery = query;
            return Task.FromResult(Page);
        }

        public Task<Topic?> GetPublicByIdAsync(int id, CancellationToken cancellationToken) =>
            Task.FromResult(Page.Items.SingleOrDefault(topic => topic.Id == id));

        public Task<Category?> GetCategoryByIdAsync(int id, CancellationToken cancellationToken) =>
            Task.FromResult(Category?.Id == id ? Category : null);

        public Task<IReadOnlyList<Tag>> GetActiveTagsByIdsAsync(
            IReadOnlyCollection<int> ids,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<Tag>>(Tags.Where(tag => ids.Contains(tag.Id)).ToList());

        public Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken) =>
            Task.FromResult(false);

        public Task AddAsync(Topic topic, CancellationToken cancellationToken)
        {
            topic.Id = 99;
            AddedTopic = topic;
            return Task.CompletedTask;
        }
    }
}
