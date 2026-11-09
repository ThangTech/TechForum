using TechForum.Api.Dtos;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Enums;
using TechForum.Api.Models;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class VoteServiceTests
{
    private readonly FakeVotes votes = new();
    private readonly Topic topic = new()
    {
        Id = 1, Title = "t", Slug = "t", Summary = "s", BodyHtml = "<p>x</p>", AuthorId = "author",
        Type = TopicType.Question, Status = TopicStatus.Published, PublishedAtUtc = DateTimeOffset.UtcNow, Score = 3
    };

    private VoteService CreateService(params Answer[] answers) =>
        new(new FakeTopics(topic), new FakeAnswers(answers), votes, TimeProvider.System);

    private static Answer CreateAnswer(int id, string authorId) => new()
    {
        Id = id, TopicId = 1, AuthorId = authorId, BodyHtml = "<p>a</p>", CreatedAtUtc = DateTimeOffset.UtcNow
    };

    [Theory]
    [InlineData(1)]
    [InlineData(-1)]
    [InlineData(0)]
    public async Task SetTopicVoteAsync_SendsTheVoteWithTheAuthorOfThePost(int value)
    {
        var result = await CreateService().SetTopicVoteAsync(1, "voter", value, default);

        Assert.Equal(VoteFailure.None, result.Failure);
        var command = Assert.Single(votes.Commands);
        Assert.Equal(("voter", VoteTargetType.Topic, 1, "author", value), (command.VoterId, command.TargetType, command.TargetId, command.AuthorId, command.NewValue));
    }

    [Theory]
    [InlineData(2)]
    [InlineData(-2)]
    [InlineData(100)]
    public async Task SetTopicVoteAsync_RefusesAValueThatIsNotOneMinusOneOrZero(int value)
    {
        var result = await CreateService().SetTopicVoteAsync(1, "voter", value, default);

        Assert.Equal(VoteFailure.InvalidValue, result.Failure);
        Assert.Empty(votes.Commands);
    }

    [Fact]
    public async Task SetTopicVoteAsync_RefusesAVoteForOwnPost()
    {
        var result = await CreateService().SetTopicVoteAsync(1, "author", 1, default);

        Assert.Equal(VoteFailure.OwnContent, result.Failure);
        Assert.Empty(votes.Commands);
    }

    [Theory]
    [InlineData(true, false, false)]
    [InlineData(false, true, false)]
    [InlineData(false, false, true)]
    public async Task SetTopicVoteAsync_RefusesAPostThatEveryoneCannotRead(bool draft, bool hidden, bool deleted)
    {
        topic.Status = draft ? TopicStatus.Draft : TopicStatus.Published;
        topic.IsHiddenByModerator = hidden;
        topic.IsDeleted = deleted;

        var result = await CreateService().SetTopicVoteAsync(1, "voter", 1, default);

        Assert.Equal(VoteFailure.NotFound, result.Failure);
        Assert.Empty(votes.Commands);
    }

    [Fact]
    public async Task SetTopicVoteAsync_GivesTheScoreAndTheVoteAfterTheChange()
    {
        votes.ScoreAfter = 4;

        var result = await CreateService().SetTopicVoteAsync(1, "voter", 1, default);

        Assert.Equal(4, result.Vote!.Score);
        Assert.Equal(1, result.Vote.MyVote);
    }

    [Fact]
    public async Task SetAnswerVoteAsync_SendsTheVoteWithTheAuthorOfTheAnswer()
    {
        var result = await CreateService(CreateAnswer(10, "answerer")).SetAnswerVoteAsync(1, 10, "voter", -1, default);

        Assert.Equal(VoteFailure.None, result.Failure);
        var command = Assert.Single(votes.Commands);
        Assert.Equal((VoteTargetType.Answer, 10, "answerer", -1), (command.TargetType, command.TargetId, command.AuthorId, command.NewValue));
    }

    [Fact]
    public async Task SetAnswerVoteAsync_RefusesOwnAnswerAndAnAnswerOfAnotherPost()
    {
        var service = CreateService(CreateAnswer(10, "answerer"), new Answer { Id = 11, TopicId = 2, AuthorId = "x", BodyHtml = "<p>b</p>" });

        Assert.Equal(VoteFailure.OwnContent, (await service.SetAnswerVoteAsync(1, 10, "answerer", 1, default)).Failure);
        Assert.Equal(VoteFailure.NotFound, (await service.SetAnswerVoteAsync(1, 11, "voter", 1, default)).Failure);
        Assert.Equal(VoteFailure.NotFound, (await service.SetAnswerVoteAsync(1, 99, "voter", 1, default)).Failure);
        Assert.Empty(votes.Commands);
    }

    [Fact]
    public async Task SetAnswerVoteAsync_RefusesADeletedOrHiddenAnswer()
    {
        var deleted = CreateAnswer(10, "answerer");
        deleted.IsDeleted = true;
        var hidden = CreateAnswer(11, "answerer");
        hidden.IsHiddenByModerator = true;
        var service = CreateService(deleted, hidden);

        Assert.Equal(VoteFailure.NotFound, (await service.SetAnswerVoteAsync(1, 10, "voter", 1, default)).Failure);
        Assert.Equal(VoteFailure.NotFound, (await service.SetAnswerVoteAsync(1, 11, "voter", 1, default)).Failure);
    }

    [Fact]
    public async Task GetTopicVoteAsync_GivesTheScoreAndTheVoteOfTheViewer_AndNoVoteToAGuest()
    {
        votes.MyVote = -1;

        var member = await CreateService().GetTopicVoteAsync(1, "voter", default);
        var guest = await CreateService().GetTopicVoteAsync(1, null, default);

        Assert.Equal((3, -1), (member!.Score, member.MyVote));
        Assert.Equal((3, 0), (guest!.Score, guest.MyVote));
    }

    [Fact]
    public async Task GetTopicVoteAsync_ForAPostThatCannotBeRead_ReturnsNull()
    {
        topic.IsDeleted = true;

        Assert.Null(await CreateService().GetTopicVoteAsync(1, "voter", default));
    }

    [Theory]
    [InlineData(VoteTargetType.Answer, 1, 10)]
    [InlineData(VoteTargetType.Answer, -1, -2)]
    [InlineData(VoteTargetType.Topic, 1, 5)]
    [InlineData(VoteTargetType.Topic, -1, -2)]
    [InlineData(VoteTargetType.Topic, 0, 0)]
    public void ReputationRules_ForVote_GivesThePointsOfTheTableOfRules(VoteTargetType type, int value, int expected)
    {
        Assert.Equal(expected, ReputationRules.ForVote(type, value));
    }

    [Fact]
    public void ReputationRules_ChangingAVoteCancelsTheOldPointsAndGivesTheNewOnes()
    {
        // An upvote that becomes a downvote of an answer: -10 (the old vote is taken back) and -2 (the new one).
        var change = ReputationRules.ForVote(VoteTargetType.Answer, -1) - ReputationRules.ForVote(VoteTargetType.Answer, 1);

        Assert.Equal(-12, change);
    }

    private sealed class FakeVotes : IVoteRepository
    {
        public List<VoteCommand> Commands { get; } = [];
        public int ScoreAfter { get; set; }
        public int MyVote { get; set; }

        public Task<VoteOutcome> ApplyAsync(VoteCommand command, CancellationToken cancellationToken)
        {
            Commands.Add(command);
            return Task.FromResult(new VoteOutcome(0, command.NewValue, ScoreAfter));
        }

        public Task<int> GetMyVoteAsync(string userId, VoteTargetType targetType, int targetId, CancellationToken cancellationToken) =>
            Task.FromResult(MyVote);
    }

    private sealed class FakeTopics(Topic topic) : ITopicRepository
    {
        public Task<Topic?> GetPublicByIdAsync(int id, CancellationToken cancellationToken) =>
            Task.FromResult(id == topic.Id && topic.Status == TopicStatus.Published && topic.PublishedAtUtc is not null &&
                !topic.IsDeleted && !topic.IsHiddenByModerator ? topic : null);
        public Task<Topic?> GetOwnedByIdAsync(int id, string authorId, CancellationToken cancellationToken) => Task.FromResult<Topic?>(null);
        public Task<TopicPage> GetPublicPageAsync(TopicQuery query, CancellationToken cancellationToken) => Task.FromResult(new TopicPage([], 0));
        public Task<TopicPage> GetFollowingPageAsync(string followerId, TopicQuery query, CancellationToken cancellationToken) => Task.FromResult(new TopicPage([], 0));
        public Task<TopicPage> GetOwnedPageAsync(string authorId, TopicQuery query, CancellationToken cancellationToken) => Task.FromResult(new TopicPage([], 0));
        public Task<Category?> GetCategoryByIdAsync(int id, CancellationToken cancellationToken) => Task.FromResult<Category?>(null);
        public Task<IReadOnlyList<Tag>> GetActiveTagsByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Tag>>([]);
        public Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> HasPublicAnswersAsync(int topicId, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> TryAddAsync(Topic topic, CancellationToken cancellationToken) => Task.FromResult(true);
        public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }

    // Only the lookup that the vote service uses; the rest of the interface is not needed here.
    private sealed class FakeAnswers(Answer[] answers) : IAnswerRepository
    {
        public Task<Answer?> GetVisibleByIdAsync(int topicId, int answerId, CancellationToken cancellationToken) =>
            Task.FromResult(answers.SingleOrDefault(answer => answer.Id == answerId && answer.TopicId == topicId &&
                !answer.IsDeleted && !answer.IsHiddenByModerator));

        public Task<AnswerPage?> GetPublicPageAsync(int topicId, int page, int pageSize, int? aroundAnswerId, string sort, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<IReadOnlyList<AnswerHelpfulState>> GetHelpfulStatesAsync(IReadOnlyCollection<int> answerIds, string? viewerId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task AdjustReputationAsync(string userId, int delta, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task AddHelpfulIfMissingAsync(AnswerHelpfulVote vote, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task RemoveHelpfulAsync(int answerId, string userId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task AddAsync(Answer answer, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<Answer?> GetOwnedByIdAsync(int topicId, int answerId, string authorId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task SaveChangesAsync(CancellationToken cancellationToken) => throw new NotSupportedException();
    }
}
