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
    public async Task GetOwnedPageAsync_ReturnsDraftAndModerationStateForRequestedAuthor()
    {
        var topic = CreateTopic();
        topic.Status = TopicStatus.Draft;
        topic.PublishedAtUtc = null;
        topic.IsHiddenByModerator = true;
        var repository = new FakeTopicRepository
        {
            OwnedPage = new TopicPage([topic], 1)
        };
        var service = CreateService(repository);

        var result = await service.GetOwnedPageAsync(
            "member-a",
            new TopicQuery(),
            CancellationToken.None);

        var item = Assert.Single(result.Items);
        Assert.Equal("draft", item.Status);
        Assert.True(item.IsHiddenByModerator);
        Assert.Null(item.PublishedAtUtc);
        Assert.Equal("member-a", repository.LastOwnedAuthorId);
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
            [],
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
            CategoryId = 1,
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

    [Fact]
    public async Task CreateAsync_WithOwnedMedia_AttachesMatchingAsset()
    {
        var mediaId = Guid.NewGuid();
        var media = new MediaAsset
        {
            Id = mediaId,
            UploaderId = "member-a",
            RelativePath = $"images/{mediaId:N}.png",
            PublicUrl = $"/media/images/{mediaId:N}.png",
            ContentType = "image/png",
            Length = 100,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };
        var repository = new FakeTopicRepository
        {
            Category = new Category { Id = 2, Name = "Web & Mobile", Slug = "web-mobile" }
        };
        var mediaRepository = new FakeMediaAssetRepository { Items = [media] };
        var service = CreateService(repository, mediaRepository);
        var request = new CreateTopicRequest(
            "Bài viết có ảnh hợp lệ",
            "Tóm tắt hợp lệ có nhiều hơn hai mươi ký tự.",
            $"<p>Nội dung có ảnh.</p><img src=\"{media.PublicUrl}\" alt=\"Ảnh\">",
            "article",
            2,
            [],
            [mediaId],
            false);

        var result = await service.CreateAsync("member-a", request, CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Same(media, Assert.Single(repository.AddedTopic!.MediaAssets));
        Assert.Contains(media.PublicUrl, result.Topic!.BodyHtml);
    }

    [Fact]
    public async Task CreateAsync_WithMediaFromDifferentOwner_ReturnsFieldError()
    {
        var mediaId = Guid.NewGuid();
        var repository = new FakeTopicRepository
        {
            Category = new Category { Id = 2, Name = "Web & Mobile", Slug = "web-mobile" }
        };
        var service = CreateService(repository, new FakeMediaAssetRepository());
        var request = new CreateTopicRequest(
            "Bài viết dùng ảnh không hợp lệ",
            "Tóm tắt hợp lệ có nhiều hơn hai mươi ký tự.",
            $"<p>Nội dung.</p><img src=\"/media/images/{mediaId:N}.png\">",
            "article",
            2,
            [],
            [mediaId],
            false);

        var result = await service.CreateAsync("member-a", request, CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Contains("mediaIds", result.Errors.Keys);
        Assert.Null(repository.AddedTopic);
    }

    [Fact]
    public async Task UpdateAsync_WithOwnedTopic_UpdatesContentAndKeepsStableSlug()
    {
        var existing = CreateTopic();
        var repository = new FakeTopicRepository
        {
            OwnedTopic = existing,
            Category = existing.Category
        };
        var service = CreateService(repository);
        var request = new UpdateTopicRequest(
            "Tiêu đề đã được cập nhật",
            "Tóm tắt mới hợp lệ có nhiều hơn hai mươi ký tự.",
            "<p>Nội dung sau khi chỉnh sửa.</p>",
            "article",
            existing.CategoryId,
            [],
            [],
            false);

        var result = await service.UpdateAsync(existing.Id, "member-a", request, CancellationToken.None);

        Assert.NotNull(result);
        Assert.True(result.Succeeded);
        Assert.Equal("Tiêu đề đã được cập nhật", existing.Title);
        Assert.Equal("cau-hoi-kiem-thu", existing.Slug);
        Assert.Equal(TopicStatus.Draft, existing.Status);
        Assert.Null(existing.PublishedAtUtc);
        Assert.True(repository.SavedChanges);
    }

    [Fact]
    public async Task SoftDeleteAsync_WithDifferentOwner_DoesNotDeleteTopic()
    {
        var repository = new FakeTopicRepository { OwnedTopic = CreateTopic() };
        var service = CreateService(repository);

        var deleted = await service.SoftDeleteAsync(10, "member-b", CancellationToken.None);

        Assert.False(deleted);
        Assert.False(repository.OwnedTopic.IsDeleted);
        Assert.False(repository.SavedChanges);
    }

    private static TopicService CreateService(
        FakeTopicRepository repository,
        FakeMediaAssetRepository? mediaRepository = null) =>
        new(repository, mediaRepository ?? new FakeMediaAssetRepository(), new ContentSanitizer(), TimeProvider.System);

    private sealed class FakeTopicRepository : ITopicRepository
    {
        public TopicPage Page { get; init; } = new([], 0);
        public TopicPage OwnedPage { get; init; } = new([], 0);
        public TopicQuery? LastQuery { get; private set; }
        public string? LastOwnedAuthorId { get; private set; }
        public Category? Category { get; init; }
        public IReadOnlyList<Tag> Tags { get; init; } = [];
        public Topic? AddedTopic { get; private set; }
        public Topic? OwnedTopic { get; init; }
        public bool SavedChanges { get; private set; }

        public Task<TopicPage> GetPublicPageAsync(
            TopicQuery query,
            CancellationToken cancellationToken)
        {
            LastQuery = query;
            return Task.FromResult(Page);
        }

        public Task<Topic?> GetPublicByIdAsync(int id, CancellationToken cancellationToken) =>
            Task.FromResult(Page.Items.SingleOrDefault(topic => topic.Id == id));

        public Task<Topic?> GetOwnedByIdAsync(
            int id,
            string authorId,
            CancellationToken cancellationToken) =>
            Task.FromResult(OwnedTopic is not null &&
                OwnedTopic.Id == id &&
                OwnedTopic.AuthorId == authorId &&
                !OwnedTopic.IsDeleted
                    ? OwnedTopic
                    : null);

        public Task<TopicPage> GetOwnedPageAsync(
            string authorId,
            TopicQuery query,
            CancellationToken cancellationToken)
        {
            LastOwnedAuthorId = authorId;
            return Task.FromResult(OwnedPage);
        }

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

        public Task SaveChangesAsync(CancellationToken cancellationToken)
        {
            SavedChanges = true;
            return Task.CompletedTask;
        }
    }

    private sealed class FakeMediaAssetRepository : IMediaAssetRepository
    {
        public IReadOnlyList<MediaAsset> Items { get; init; } = [];

        public Task AddAsync(MediaAsset mediaAsset, CancellationToken cancellationToken) =>
            Task.CompletedTask;

        public Task<MediaAsset?> GetOwnedAsync(
            Guid id,
            string uploaderId,
            CancellationToken cancellationToken) =>
            Task.FromResult(Items.SingleOrDefault(item =>
                item.Id == id && item.UploaderId == uploaderId));

        public Task<IReadOnlyList<MediaAsset>> GetOwnedUnattachedByIdsAsync(
            IReadOnlyCollection<Guid> ids,
            string uploaderId,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<MediaAsset>>(Items.Where(item =>
                ids.Contains(item.Id) &&
                item.UploaderId == uploaderId &&
                item.TopicId == null).ToList());

        public Task<IReadOnlyList<MediaAsset>> GetOwnedAvailableForTopicByIdsAsync(
            IReadOnlyCollection<Guid> ids,
            string uploaderId,
            int topicId,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<MediaAsset>>(Items.Where(item =>
                ids.Contains(item.Id) &&
                item.UploaderId == uploaderId &&
                (item.TopicId == null || item.TopicId == topicId)).ToList());

        public Task<IReadOnlyList<MediaAsset>> GetOrphansOlderThanAsync(
            DateTimeOffset threshold,
            int take,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<MediaAsset>>([]);

        public Task DeleteAsync(MediaAsset mediaAsset, CancellationToken cancellationToken) =>
            Task.CompletedTask;
    }
}
