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
        Assert.True(IsPublic(CreateTopic(TestIds.Id(1))));
    }

    [Fact]
    public void DraftTopic_IsNotPublic()
    {
        Assert.False(IsPublic(CreateTopic(TestIds.Id(1), status: TopicStatus.Draft)));
    }

    [Fact]
    public void PublishedTopicWithoutPublishDate_IsNotPublic()
    {
        Assert.False(IsPublic(CreateTopic(TestIds.Id(1), hasPublishDate: false)));
    }

    [Fact]
    public void DeletedTopic_IsNotPublic()
    {
        Assert.False(IsPublic(CreateTopic(TestIds.Id(1), isDeleted: true)));
    }

    [Fact]
    public void TopicHiddenByModerator_IsNotPublic()
    {
        Assert.False(IsPublic(CreateTopic(TestIds.Id(1), isHidden: true)));
    }

    [Fact]
    public void IsPublicTopic_GivesTheSameAnswerAsTheExpression()
    {
        Assert.True(TopicVisibility.IsPublicTopic(CreateTopic(TestIds.Id(1))));
        Assert.False(TopicVisibility.IsPublicTopic(CreateTopic(TestIds.Id(2), isHidden: true)));
        Assert.False(TopicVisibility.IsPublicTopic(CreateTopic(TestIds.Id(3), status: TopicStatus.Draft)));
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
            CreateAnswer(TestIds.Id(1), CreateTopic(TestIds.Id(1))),
            CreateAnswer(TestIds.Id(2), CreateTopic(TestIds.Id(2), status: TopicStatus.Draft)),
            CreateAnswer(TestIds.Id(3), CreateTopic(TestIds.Id(3), isDeleted: true)),
            CreateAnswer(TestIds.Id(4), CreateTopic(TestIds.Id(4), isHidden: true)),
            CreateAnswer(TestIds.Id(5), CreateTopic(TestIds.Id(5)))
        }.AsQueryable();

        var publicIds = answers.WhereTopicIsPublic(answer => answer.Topic).Select(answer => answer.Id).ToList();

        Assert.Equal(new[] { TestIds.Id(1), TestIds.Id(5) }, publicIds);
    }

    [Fact]
    public void WhereTopicIsPublic_CanBeCombinedWithOtherFilters()
    {
        var answers = new[]
        {
            CreateAnswer(TestIds.Id(1), CreateTopic(TestIds.Id(1)), "a"),
            CreateAnswer(TestIds.Id(2), CreateTopic(TestIds.Id(2)), "b"),
            CreateAnswer(TestIds.Id(3), CreateTopic(TestIds.Id(3), isHidden: true), "a")
        }.AsQueryable();

        var publicIds = answers
            .Where(answer => answer.AuthorId == "a")
            .WhereTopicIsPublic(answer => answer.Topic)
            .Select(answer => answer.Id)
            .ToList();

        Assert.Equal(new[] { TestIds.Id(1) }, publicIds);
    }

    private static Topic CreateTopic(
        Guid id,
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

    private static Answer CreateAnswer(Guid id, Topic topic, string authorId = "member-a") => new()
    {
        Id = id,
        AuthorId = authorId,
        BodyHtml = "<p>Nội dung</p>",
        Topic = topic
    };
}
