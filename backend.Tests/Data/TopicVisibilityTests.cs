using TechForum.Api.Data.Repositories;
using TechForum.Api.Enums;
using TechForum.Api.Models;
using Xunit;

namespace TechForum.Api.Tests.Data;

// The rule is an expression that EF Core turns into SQL. These tests run the same expression in
// memory, so every case of the rule is checked without a database.
public sealed class TopicVisibilityTests
{
    private static readonly Func<Topic, bool> IsPublic = TopicVisibility.IsPublic.Compile();

    [Fact]
    public void PublishedTopic_IsPublic()
    {
        Assert.True(IsPublic(CreateTopic(1)));
    }

    [Fact]
    public void DraftTopic_IsNotPublic()
    {
        Assert.False(IsPublic(CreateTopic(1, status: TopicStatus.Draft)));
    }

    [Fact]
    public void PublishedTopicWithoutPublishDate_IsNotPublic()
    {
        Assert.False(IsPublic(CreateTopic(1, hasPublishDate: false)));
    }

    [Fact]
    public void DeletedTopic_IsNotPublic()
    {
        Assert.False(IsPublic(CreateTopic(1, isDeleted: true)));
    }

    [Fact]
    public void TopicHiddenByModerator_IsNotPublic()
    {
        Assert.False(IsPublic(CreateTopic(1, isHidden: true)));
    }

    [Fact]
    public void IsPublicTopic_GivesTheSameAnswerAsTheExpression()
    {
        Assert.True(TopicVisibility.IsPublicTopic(CreateTopic(1)));
        Assert.False(TopicVisibility.IsPublicTopic(CreateTopic(2, isHidden: true)));
        Assert.False(TopicVisibility.IsPublicTopic(CreateTopic(3, status: TopicStatus.Draft)));
    }

    [Fact]
    public void IsPublicTopic_IsFalseWhenThereIsNoTopic()
    {
        Assert.False(TopicVisibility.IsPublicTopic(null));
    }

    [Fact]
    public void WhereTopicIsPublic_KeepsOnlyRowsOfPublicTopics()
    {
        var answers = new[]
        {
            CreateAnswer(1, CreateTopic(1)),
            CreateAnswer(2, CreateTopic(2, status: TopicStatus.Draft)),
            CreateAnswer(3, CreateTopic(3, isDeleted: true)),
            CreateAnswer(4, CreateTopic(4, isHidden: true)),
            CreateAnswer(5, CreateTopic(5))
        }.AsQueryable();

        var publicIds = answers.WhereTopicIsPublic(answer => answer.Topic).Select(answer => answer.Id).ToList();

        Assert.Equal(new[] { 1, 5 }, publicIds);
    }

    [Fact]
    public void WhereTopicIsPublic_CanBeCombinedWithOtherFilters()
    {
        var answers = new[]
        {
            CreateAnswer(1, CreateTopic(1), "a"),
            CreateAnswer(2, CreateTopic(2), "b"),
            CreateAnswer(3, CreateTopic(3, isHidden: true), "a")
        }.AsQueryable();

        var publicIds = answers
            .Where(answer => answer.AuthorId == "a")
            .WhereTopicIsPublic(answer => answer.Topic)
            .Select(answer => answer.Id)
            .ToList();

        Assert.Equal(new[] { 1 }, publicIds);
    }

    private static Topic CreateTopic(
        int id,
        TopicStatus status = TopicStatus.Published,
        bool hasPublishDate = true,
        bool isDeleted = false,
        bool isHidden = false) => new()
    {
        Id = id,
        Title = "Tiêu đề",
        Slug = "tieu-de-" + id,
        Summary = "Tóm tắt",
        BodyHtml = "<p>Nội dung</p>",
        AuthorId = "member-a",
        Status = status,
        PublishedAtUtc = hasPublishDate ? DateTimeOffset.UtcNow : null,
        IsDeleted = isDeleted,
        IsHiddenByModerator = isHidden
    };

    private static Answer CreateAnswer(int id, Topic topic, string authorId = "member-a") => new()
    {
        Id = id,
        AuthorId = authorId,
        BodyHtml = "<p>Nội dung</p>",
        Topic = topic
    };
}
