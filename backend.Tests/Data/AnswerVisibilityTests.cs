using TechForum.Api.Data.Repositories;
using TechForum.Api.Models;
using Xunit;

namespace TechForum.Api.Tests.Data;

// The rule is an expression that EF Core turns into SQL. These tests run the same expression in
// memory, so every case of the rule is checked without a database.
public sealed class AnswerVisibilityTests
{
    private static readonly Func<Answer, bool> IsPublic = AnswerVisibility.IsPublic.Compile();

    [Fact]
    public void TopLevelAnswer_IsPublic()
    {
        Assert.True(IsPublic(CreateAnswer(1)));
    }

    [Fact]
    public void DeletedOrHiddenTopLevelAnswer_IsNotPublic()
    {
        Assert.False(IsPublic(CreateAnswer(1, isDeleted: true)));
        Assert.False(IsPublic(CreateAnswer(2, isHidden: true)));
    }

    [Fact]
    public void ReplyToAVisibleTopLevelAnswer_IsPublic()
    {
        var parent = CreateAnswer(1);

        Assert.True(IsPublic(CreateReply(2, parent)));
    }

    [Fact]
    public void ReplyWhoseParentIsDeleted_IsNotPublic()
    {
        var parent = CreateAnswer(1, isDeleted: true);

        Assert.False(IsPublic(CreateReply(2, parent)));
    }

    [Fact]
    public void ReplyWhoseParentIsHidden_IsNotPublic()
    {
        var parent = CreateAnswer(1, isHidden: true);

        Assert.False(IsPublic(CreateReply(2, parent)));
    }

    [Fact]
    public void DeletedOrHiddenReply_IsNotPublicEvenWithAVisibleParent()
    {
        var parent = CreateAnswer(1);

        Assert.False(IsPublic(CreateReply(2, parent, isDeleted: true)));
        Assert.False(IsPublic(CreateReply(3, parent, isHidden: true)));
    }

    [Fact]
    public void ReplyToAReply_IsNotPublic_BecauseOnlyOneLevelOfRepliesExists()
    {
        var topLevel = CreateAnswer(1);
        var reply = CreateReply(2, topLevel);

        Assert.False(IsPublic(CreateReply(3, reply)));
    }

    [Fact]
    public void ReplyWhoseParentBelongsToAnotherTopic_IsNotPublic()
    {
        var parentInAnotherTopic = CreateAnswer(1, topicId: 99);

        Assert.False(IsPublic(CreateReply(2, parentInAnotherTopic, topicId: 10)));
    }

    [Fact]
    public void ReplyWhoseParentWasNotLoaded_IsNotPublic()
    {
        var reply = CreateAnswer(2);
        reply.ParentAnswerId = 1;
        reply.ParentAnswer = null;

        Assert.False(IsPublic(reply));
    }

    private static Answer CreateAnswer(int id, int topicId = 10, bool isDeleted = false, bool isHidden = false) => new()
    {
        Id = id,
        TopicId = topicId,
        AuthorId = "member-a",
        BodyHtml = "<p>Nội dung</p>",
        IsDeleted = isDeleted,
        IsHiddenByModerator = isHidden
    };

    private static Answer CreateReply(
        int id,
        Answer parent,
        int topicId = 10,
        bool isDeleted = false,
        bool isHidden = false)
    {
        var reply = CreateAnswer(id, topicId, isDeleted, isHidden);
        reply.ParentAnswerId = parent.Id;
        reply.ParentAnswer = parent;
        return reply;
    }
}
