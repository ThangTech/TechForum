using TechForum.Api.Data.Repositories;
using TechForum.Api.Enums;
using TechForum.Api.Models;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class PublicProfileServiceTests
{
    [Fact]
    public async Task GetByUserIdAsync_MapsPublicFieldsWithoutEmail()
    {
        var user = CreateUser();
        var repository = new FakePublicProfileRepository
        {
            Profile = new PublicProfileData(user, 3, 5, 7, 2, 1, true,
                [new ProfileSkillData(1, "React", "react", 3)], [CreateTopic(user)])
        };
        var service = new PublicProfileService(repository);

        var result = await service.GetByUserIdAsync(user.Id, "viewer", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(user.Id, result.Id);
        Assert.Equal("Thành viên kiểm thử", result.DisplayName);
        Assert.Equal(3, result.PublishedTopicCount);
        Assert.Equal(3, result.Badges.Count);
        Assert.True(result.IsFollowedByViewer);
        Assert.Single(result.Skills);
        Assert.Single(result.RecentTopics);
        Assert.Equal("article", result.RecentTopics[0].Type);
        Assert.DoesNotContain("email", System.Text.Json.JsonSerializer.Serialize(result).ToLowerInvariant());
    }

    [Fact]
    public async Task GetByUserIdAsync_WhenMissing_ReturnsNull()
    {
        var service = new PublicProfileService(new FakePublicProfileRepository());

        var result = await service.GetByUserIdAsync("missing", null, CancellationToken.None);

        Assert.Null(result);
    }

    private static ApplicationUser CreateUser() => new()
    {
        Id = "member-profile",
        UserName = "profile@techforum.local",
        Email = "profile@techforum.local",
        DisplayName = "Thành viên kiểm thử",
        CreatedAtUtc = new DateTimeOffset(2026, 10, 3, 0, 0, 0, TimeSpan.Zero)
    };

    private static Topic CreateTopic(ApplicationUser user)
    {
        var tag = new Tag { Id = 1, Name = "React", Slug = "react" };
        return new Topic
        {
            Id = 1,
            Title = "Bài viết kiểm thử",
            Slug = "bai-viet-kiem-thu",
            Summary = "Tóm tắt",
            BodyHtml = "<p>Nội dung</p>",
            Type = TopicType.Article,
            Status = TopicStatus.Published,
            Category = new Category { Id = 1, Name = "Frontend", Slug = "frontend" },
            AuthorId = user.Id,
            Author = user,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            PublishedAtUtc = DateTimeOffset.UtcNow,
            TopicTags = [new TopicTag { TagId = tag.Id, Tag = tag }]
        };
    }

    private sealed class FakePublicProfileRepository : IPublicProfileRepository
    {
        public PublicProfileData? Profile { get; init; }

        public Task<PublicProfileData?> GetByUserIdAsync(
            string userId,
            string? viewerId,
            CancellationToken cancellationToken) => Task.FromResult(Profile);
    }
}
