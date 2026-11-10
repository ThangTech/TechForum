using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Dtos;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Enums;
using TechForum.Api.Models;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class VoteServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 20, 12, 0, 0, TimeSpan.Zero);

    private readonly FakeVotes votes = new();
    private readonly FakeAccounts accounts = new();
    private readonly FakeLimiter limiter = new();
    private readonly Topic topic = new()
    {
        Id = 1, Title = "t", Slug = "t", Summary = "s", BodyHtml = "<p>x</p>", AuthorId = "author",
        Type = TopicType.Question, Status = TopicStatus.Published, PublishedAtUtc = DateTimeOffset.UtcNow, Score = 3
    };

    private VoteService CreateService(params Answer[] answers) =>
        new(new FakeTopics(topic), new FakeAnswers(answers), votes, accounts, limiter,
            Options.Create(new VoteLimitOptions { MinAccountAgeDays = 3 }), new FixedTime(Now));

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
    public async Task SetTopicVoteAsync_ADownvoteNeedsSevenDaysOrFiftyReputation()
    {
        accounts.CreatedAt["voter"] = Now.AddDays(-5);

        var result = await CreateService().SetTopicVoteAsync(1, "voter", -1, default);

        Assert.Equal(VoteFailure.DownvoteNotAllowed, result.Failure);
        Assert.Equal(new DownvoteRequirement(7, 50, 2, 50), result.Downvote);
        Assert.Empty(votes.Commands);
    }

    [Fact]
    public async Task SetTopicVoteAsync_AnAccountOfFiveDaysMayUpvote()
    {
        accounts.CreatedAt["voter"] = Now.AddDays(-5);

        var result = await CreateService().SetTopicVoteAsync(1, "voter", 1, default);

        Assert.Equal(VoteFailure.None, result.Failure);
    }

    [Fact]
    public async Task SetTopicVoteAsync_AnAccountOfExactlySevenDaysMayDownvote()
    {
        accounts.CreatedAt["voter"] = Now.AddDays(-7);

        var result = await CreateService().SetTopicVoteAsync(1, "voter", -1, default);

        Assert.Equal(VoteFailure.None, result.Failure);
    }

    [Theory]
    [InlineData(50, true)]
    [InlineData(120, true)]
    [InlineData(49, false)]
    [InlineData(0, false)]
    [InlineData(-8, false)]
    public async Task SetTopicVoteAsync_AYoungAccountMayDownvoteOnlyWithFiftyReputation(int reputation, bool allowed)
    {
        accounts.CreatedAt["voter"] = Now.AddDays(-4);
        accounts.Reputation["voter"] = reputation;

        var result = await CreateService().SetTopicVoteAsync(1, "voter", -1, default);

        Assert.Equal(allowed ? VoteFailure.None : VoteFailure.DownvoteNotAllowed, result.Failure);
        if (!allowed) Assert.Equal(50 - Math.Max(0, reputation), result.Downvote!.ReputationLeft);
    }

    [Fact]
    public async Task SetAnswerVoteAsync_ADownvoteOfAnAnswerHasTheSameRule()
    {
        accounts.CreatedAt["voter"] = Now.AddDays(-4);

        var down = await CreateService(CreateAnswer(10, "answerer")).SetAnswerVoteAsync(1, 10, "voter", -1, default);
        var up = await CreateService(CreateAnswer(10, "answerer")).SetAnswerVoteAsync(1, 10, "voter", 1, default);

        Assert.Equal(VoteFailure.DownvoteNotAllowed, down.Failure);
        Assert.Equal(VoteFailure.None, up.Failure);
    }

    [Fact]
    public async Task SetTopicVoteAsync_AYoungAccountMayAlwaysTakeADownvoteBack()
    {
        accounts.CreatedAt["voter"] = Now.AddDays(-4);

        var result = await CreateService().SetTopicVoteAsync(1, "voter", 0, default);

        Assert.Equal(VoteFailure.None, result.Failure);
    }

    [Theory]
    [InlineData(0, true)]
    [InlineData(30, true)]
    [InlineData(119, true)]
    [InlineData(120, false)]
    [InlineData(121, false)]
    [InlineData(60 * 24, false)]
    public void ReputationRules_IsScoreHidden_OnlyForTheFirstTwoHours(int minutesAgo, bool hidden)
    {
        Assert.Equal(hidden, ReputationRules.IsScoreHidden(Now.AddMinutes(-minutesAgo), Now));
    }

    [Theory]
    [InlineData(9, true, 0)]
    [InlineData(-9, true, 0)]
    [InlineData(9, false, 9)]
    [InlineData(-9, false, 0)]
    public void ReputationRules_ShownScore_IsZeroWhileHiddenAndNeverBelowZero(int score, bool hidden, int expected)
    {
        Assert.Equal(expected, ReputationRules.ShownScore(score, hidden));
    }

    [Fact]
    public async Task GetTopicVoteAsync_ANewPostHidesItsScoreButNotTheVoteOfTheViewer()
    {
        topic.PublishedAtUtc = Now.AddMinutes(-30);
        topic.Score = 8;
        votes.MyVote = 1;

        var vote = await CreateService().GetTopicVoteAsync(1, "voter", default);

        Assert.True(vote!.ScoreHidden);
        Assert.Equal(0, vote.Score);
        Assert.Equal(1, vote.MyVote);
    }

    [Fact]
    public async Task GetTopicVoteAsync_APostOlderThanTwoHoursShowsItsScore()
    {
        topic.PublishedAtUtc = Now.AddHours(-3);
        topic.Score = 8;

        var vote = await CreateService().GetTopicVoteAsync(1, "voter", default);

        Assert.False(vote!.ScoreHidden);
        Assert.Equal(8, vote.Score);
    }

    [Fact]
    public async Task SetTopicVoteAsync_OnANewPost_AnswersWithAHiddenScore()
    {
        topic.PublishedAtUtc = Now.AddMinutes(-10);
        votes.ScoreAfter = 5;

        var result = await CreateService().SetTopicVoteAsync(1, "voter", 1, default);

        Assert.Equal(new VoteDto(0, 1, true), result.Vote);
    }

    [Fact]
    public async Task SetAnswerVoteAsync_HidesTheScoreOfANewAnswerOnly()
    {
        votes.ScoreAfter = 4;
        var fresh = CreateAnswer(10, "answerer");
        fresh.CreatedAtUtc = Now.AddMinutes(-20);
        var old = CreateAnswer(11, "answerer");
        old.CreatedAtUtc = Now.AddHours(-5);
        var service = CreateService(fresh, old);

        var freshResult = await service.SetAnswerVoteAsync(1, 10, "voter", 1, default);
        var oldResult = await service.SetAnswerVoteAsync(1, 11, "voter", 1, default);

        Assert.Equal(new VoteDto(0, 1, true), freshResult.Vote);
        Assert.Equal(new VoteDto(4, 1, false), oldResult.Vote);
    }

    [Theory]
    [InlineData(-1, -1)]
    [InlineData(1, 0)]
    [InlineData(0, 0)]
    public void ReputationRules_ForVoter_OnlyADownvoteCosts(int value, int expected)
    {
        Assert.Equal(expected, ReputationRules.ForVoter(value));
    }

    [Theory]
    // previous vote, new vote, change of the reputation of the voter
    [InlineData(0, -1, -1)]  // a new downvote costs 1
    [InlineData(-1, 0, 1)]   // taking it back gives the 1 back
    [InlineData(-1, 1, 1)]   // changing it to an upvote gives the 1 back
    [InlineData(1, -1, -1)]  // changing an upvote to a downvote costs 1
    [InlineData(1, 0, 0)]    // an upvote never cost anything
    [InlineData(-1, -1, 0)]  // the same vote again changes nothing
    public void ReputationRules_TheCostOfADownvoteIsPaidAndGivenBackExactly(int previous, int next, int expectedChange)
    {
        Assert.Equal(expectedChange, ReputationRules.ForVoter(next) - ReputationRules.ForVoter(previous));
    }

    [Theory]
    [InlineData(-5, 0)]
    [InlineData(-1, 0)]
    [InlineData(0, 0)]
    [InlineData(7, 7)]
    public async Task SetTopicVoteAsync_NeverShowsAScoreBelowZero(int realScore, int shown)
    {
        votes.ScoreAfter = realScore;

        var result = await CreateService().SetTopicVoteAsync(1, "voter", -1, default);

        Assert.Equal(shown, result.Vote!.Score);
    }

    [Fact]
    public async Task GetTopicVoteAsync_NeverShowsAScoreBelowZero()
    {
        topic.Score = -4;

        var vote = await CreateService().GetTopicVoteAsync(1, "voter", default);

        Assert.Equal(0, vote!.Score);
    }

    [Theory]
    [InlineData(-30, 0)]
    [InlineData(-1, 0)]
    [InlineData(0, 0)]
    [InlineData(12, 12)]
    public void ReputationRules_ForDisplay_IsNeverBelowZero(int points, int expected)
    {
        Assert.Equal(expected, ReputationRules.ForDisplay(points));
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

    [Fact]
    public async Task SetTopicVoteAsync_RefusesAnAccountThatIsLessThanThreeDaysOld()
    {
        accounts.CreatedAt["voter"] = Now.AddDays(-1);

        var up = await CreateService().SetTopicVoteAsync(1, "voter", 1, default);
        var down = await CreateService().SetTopicVoteAsync(1, "voter", -1, default);

        Assert.Equal(VoteFailure.AccountTooNew, up.Failure);
        Assert.Equal(2, up.DaysLeft);
        Assert.Equal(VoteFailure.AccountTooNew, down.Failure);
        Assert.Empty(votes.Commands);
    }

    [Fact]
    public async Task SetAnswerVoteAsync_RefusesAnAccountThatIsLessThanThreeDaysOld()
    {
        accounts.CreatedAt["voter"] = Now.AddDays(-2).AddHours(-23);

        var result = await CreateService(CreateAnswer(10, "answerer")).SetAnswerVoteAsync(1, 10, "voter", 1, default);

        Assert.Equal(VoteFailure.AccountTooNew, result.Failure);
        Assert.Equal(1, result.DaysLeft);
        Assert.Empty(votes.Commands);
    }

    [Fact]
    public async Task SetTopicVoteAsync_AllowsAnAccountThatIsExactlyThreeDaysOld()
    {
        accounts.CreatedAt["voter"] = Now.AddDays(-3);

        var result = await CreateService().SetTopicVoteAsync(1, "voter", 1, default);

        Assert.Equal(VoteFailure.None, result.Failure);
    }

    [Fact]
    public async Task SetTopicVoteAsync_ANewAccountMayStillTakeAVoteBack()
    {
        accounts.CreatedAt["voter"] = Now.AddHours(-1);

        var result = await CreateService().SetTopicVoteAsync(1, "voter", 0, default);

        Assert.Equal(VoteFailure.None, result.Failure);
        Assert.Equal(0, Assert.Single(votes.Commands).NewValue);
    }

    [Fact]
    public async Task SetTopicVoteAsync_WhenTheMemberVotesTooFast_IsRefusedWithTheTimeToWait()
    {
        limiter.Allow = false;
        limiter.RetryAfter = TimeSpan.FromSeconds(44.2);

        var result = await CreateService().SetTopicVoteAsync(1, "voter", 1, default);

        Assert.Equal(VoteFailure.RateLimited, result.Failure);
        Assert.Equal(45, result.RetryAfterSeconds);
        Assert.Empty(votes.Commands);
    }

    [Fact]
    public async Task SetAnswerVoteAsync_WhenTheMemberVotesTooFast_IsRefused()
    {
        limiter.Allow = false;

        var result = await CreateService(CreateAnswer(10, "answerer")).SetAnswerVoteAsync(1, 10, "voter", 1, default);

        Assert.Equal(VoteFailure.RateLimited, result.Failure);
        Assert.True(result.RetryAfterSeconds >= 1);
    }

    [Fact]
    public async Task SetTopicVoteAsync_AWrongValueDoesNotUseAPlaceOfTheLimit()
    {
        await CreateService().SetTopicVoteAsync(1, "voter", 9, default);

        Assert.Equal(0, limiter.Calls);
    }

    [Fact]
    public async Task SetTopicVoteAsync_EveryAcceptedRequestUsesAPlaceOfTheLimit()
    {
        await CreateService().SetTopicVoteAsync(1, "voter", 1, default);
        await CreateService().SetTopicVoteAsync(1, "voter", 0, default);

        Assert.Equal(2, limiter.Calls);
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

    private sealed class FixedTime(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private sealed class FakeLimiter : IVoteRateLimiter
    {
        public bool Allow { get; set; } = true;
        public TimeSpan RetryAfter { get; set; } = TimeSpan.FromSeconds(30);
        public int Calls { get; private set; }

        public bool TryAcquire(string userId, out TimeSpan retryAfter)
        {
            Calls++;
            retryAfter = Allow ? TimeSpan.Zero : RetryAfter;
            return Allow;
        }
    }

    // Every account is old enough (30 days) unless a test gives it another time.
    private sealed class FakeAccounts : IAccountRepository
    {
        public Dictionary<string, DateTimeOffset> CreatedAt { get; } = [];
        public Dictionary<string, int> Reputation { get; } = [];

        public Task<ApplicationUser?> FindByIdAsync(string userId) =>
            Task.FromResult<ApplicationUser?>(new ApplicationUser
            {
                Id = userId,
                DisplayName = userId,
                CreatedAtUtc = CreatedAt.GetValueOrDefault(userId, Now.AddDays(-30)),
                Reputation = Reputation.GetValueOrDefault(userId)
            });

        public Task<ApplicationUser?> FindByEmailAsync(string email) => throw new NotSupportedException();
        public Task<IdentityResult> CreateMemberAsync(ApplicationUser user, string password) => throw new NotSupportedException();
        public Task<SignInResult> CheckPasswordAsync(ApplicationUser user, string password) => throw new NotSupportedException();
        public Task<bool> IsLockedOutAsync(ApplicationUser user) => throw new NotSupportedException();
        public Task<IReadOnlyList<string>> GetRolesAsync(ApplicationUser user) => throw new NotSupportedException();
        public Task<IdentityResult> UpdateAsync(ApplicationUser user) => throw new NotSupportedException();
        public Task<IdentityResult> ChangePasswordAsync(ApplicationUser user, string currentPassword, string newPassword) => throw new NotSupportedException();
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
