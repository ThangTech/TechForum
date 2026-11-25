using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class ShareCardServiceTests
{
    [Fact]
    public async Task GetTopicCardAsync_GivesTheTitleSummaryImageAndLinkOfThePost()
    {
        var topic = CreateTopic("Dùng <React> & TypeScript", "/media/images/cover.png");

        var card = await Service(topic).GetTopicCardAsync(topic.Id, CancellationToken.None);

        Assert.True(card.Found);
        Assert.Contains("<meta property=\"og:title\" content=\"Dùng &lt;React&gt; &amp; TypeScript · TechForum\">", card.Html);
        Assert.Contains("<meta property=\"og:image\" content=\"https://www.forum.example/media/images/cover.png\">", card.Html);
        Assert.Contains($"<meta property=\"og:url\" content=\"https://www.forum.example/topics/{topic.Id}\">", card.Html);
        Assert.Contains("summary_large_image", card.Html);
    }

    [Fact]
    public async Task GetTopicCardAsync_WithoutCoverOrForAMissingPost_HasNoImage()
    {
        var topic = CreateTopic("Câu hỏi", null);

        var withoutCover = await Service(topic).GetTopicCardAsync(topic.Id, CancellationToken.None);
        var missing = await Service(topic).GetTopicCardAsync(Guid.NewGuid(), CancellationToken.None);

        Assert.DoesNotContain("og:image", withoutCover.Html);
        Assert.False(missing.Found);
        Assert.Contains("Không tìm thấy nội dung", missing.Html);
    }

    private static ShareCardService Service(Topic topic) =>
        new(new OneTopic(topic), Options.Create(new RecoveryEmailOptions { FrontendUrl = "https://www.forum.example" }));

    private static Topic CreateTopic(string title, string? cover) => new()
    {
        Id = Guid.NewGuid(), Title = title, Slug = "bai", Summary = "Tóm tắt bài", BodyHtml = "<p>x</p>", AuthorId = "author",
        CoverImageUrl = cover, Status = TopicStatus.Published, PublishedAtUtc = DateTimeOffset.UtcNow
    };

    private sealed class OneTopic(Topic topic) : ITopicRepository
    {
        public Task<Topic?> GetPublicByIdAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult<Topic?>(id == topic.Id ? topic : null);
        public Task<TopicPage> GetPublicPageAsync(TopicQuery query, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<TopicPage> GetFollowingPageAsync(string followerId, TopicQuery query, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<TopicPage> GetOwnedPageAsync(string authorId, TopicQuery query, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<Topic?> GetOwnedByIdAsync(Guid id, string authorId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<Category?> GetCategoryByIdAsync(Guid id, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<IReadOnlyList<Tag>> GetActiveTagsByIdsAsync(IReadOnlyCollection<Guid> ids, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<bool> HasPublicAnswersAsync(Guid topicId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<bool> TryAddAsync(Topic topic, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task SaveChangesAsync(CancellationToken cancellationToken) => throw new NotSupportedException();
    }
}
