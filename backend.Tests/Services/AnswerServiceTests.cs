using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class AnswerServiceTests
{
    [Fact]
    public async Task GetPublicPageAsync_ArticleWithLegacySolution_DoesNotMarkReplyAccepted()
    {
        var topic = CreateTopic();
        topic.Type = TopicType.Article;
        topic.AcceptedAnswerId = TestIds.Id(10);
        var answerRepository = new FakeAnswerRepository
        {
            PageResult = new AnswerPage([CreateAnswer(TestIds.Id(10), "member-a")], 1, 1)
        };
        var service = new AnswerService(answerRepository,
            new FakeTopicRepository(topic), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        var result = await service.GetPublicPageAsync(TestIds.Id(1), new AnswerQuery(), CancellationToken.None);

        Assert.NotNull(result);
        Assert.False(Assert.Single(result.Items).IsAccepted);
    }

    [Fact]
    public async Task GetPublicPageAsync_UsesPageContainingLinkedAnswer()
    {
        var answerRepository = new FakeAnswerRepository
        {
            PageResult = new AnswerPage([CreateAnswer(TestIds.Id(41), "member-a")], 41, 3)
        };
        var service = new AnswerService(answerRepository,
            new FakeTopicRepository(CreateTopic()), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        var result = await service.GetPublicPageAsync(TestIds.Id(1),
            new AnswerQuery { Page = 1, PageSize = 20, AroundAnswerId = TestIds.Id(41) }, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(TestIds.Id(41), answerRepository.LastAroundAnswerId);
        Assert.Equal(3, result.Page);
        Assert.Equal(3, result.TotalPages);
        Assert.Equal(TestIds.Id(41), Assert.Single(result.Items).Id);
    }

    [Theory]
    // minutes since the answer was written, real score, shown score, hidden
    [InlineData(20, 7, 0, true)]
    [InlineData(300, 7, 7, false)]
    [InlineData(300, -3, 0, false)]
    public async Task GetPublicPageAsync_HidesTheScoreOfANewAnswer(int minutesAgo, int score, int shown, bool hidden)
    {
        var answer = CreateAnswer(TestIds.Id(10), "member-a");
        answer.CreatedAtUtc = DateTimeOffset.UtcNow.AddMinutes(-minutesAgo);
        answer.Score = score;
        var repository = new FakeAnswerRepository(answer) { PageResult = new AnswerPage([answer], 1, 1) };
        var service = new AnswerService(repository, new FakeTopicRepository(CreateTopic()), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        var item = Assert.Single((await service.GetPublicPageAsync(TestIds.Id(1), new AnswerQuery(), CancellationToken.None))!.Items);

        Assert.Equal(shown, item.Score);
        Assert.Equal(hidden, item.ScoreHidden);
    }

    [Fact]
    public async Task GetPublicPageAsync_WhenLinkedAnswerUnavailable_ReturnsNotFound()
    {
        var answerRepository = new FakeAnswerRepository { PageResult = null };
        var service = new AnswerService(answerRepository,
            new FakeTopicRepository(CreateTopic()), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        var result = await service.GetPublicPageAsync(TestIds.Id(1),
            new AnswerQuery { AroundAnswerId = TestIds.Id(41) }, CancellationToken.None);

        Assert.Null(result);
        Assert.Equal(1, answerRepository.PageCallCount);
    }

    [Theory]
    [InlineData(true, false, false)]
    [InlineData(false, true, false)]
    [InlineData(false, false, true)]
    public async Task GetPublicPageAsync_WhenTopicNotPublic_DoesNotLocateAnswer(bool draft, bool hidden, bool deleted)
    {
        var topic = CreateTopic();
        topic.Status = draft ? TopicStatus.Draft : TopicStatus.Published;
        topic.IsHiddenByModerator = hidden;
        topic.IsDeleted = deleted;
        var answerRepository = new FakeAnswerRepository();
        var service = new AnswerService(answerRepository,
            new FakeTopicRepository(topic), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        var result = await service.GetPublicPageAsync(TestIds.Id(1),
            new AnswerQuery { AroundAnswerId = TestIds.Id(41) }, CancellationToken.None);

        Assert.Null(result);
        Assert.Equal(0, answerRepository.PageCallCount);
    }

    [Fact]
    public async Task AcceptAsync_GivesTheBonusToTheAuthorOfTheChosenAnswer()
    {
        var topic = CreateTopic();
        var repository = new FakeAnswerRepository(CreateAnswer(TestIds.Id(10), "member-a"));
        var service = new AnswerService(repository, new FakeTopicRepository(topic), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        var result = await service.AcceptAsync(TestIds.Id(1), TestIds.Id(10), topic.AuthorId, CancellationToken.None);

        Assert.Equal(AcceptAnswerFailure.None, result.Failure);
        Assert.Equal(("member-a", ReputationRules.AcceptedAnswer), Assert.Single(repository.ReputationChanges));
    }

    [Fact]
    public async Task AcceptAsync_MovesTheBonusWhenTheChosenAnswerChanges()
    {
        var topic = CreateTopic();
        topic.AcceptedAnswerId = TestIds.Id(9);
        var repository = new FakeAnswerRepository(CreateAnswer(TestIds.Id(9), "member-b"), CreateAnswer(TestIds.Id(10), "member-a"));
        var service = new AnswerService(repository, new FakeTopicRepository(topic), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        await service.AcceptAsync(TestIds.Id(1), TestIds.Id(10), topic.AuthorId, CancellationToken.None);

        Assert.Equal(
            [("member-a", ReputationRules.AcceptedAnswer), ("member-b", -ReputationRules.AcceptedAnswer)],
            repository.ReputationChanges);
    }

    [Fact]
    public async Task AcceptAsync_ChoosingTheSameAnswerAgainChangesNothing()
    {
        var topic = CreateTopic();
        topic.AcceptedAnswerId = TestIds.Id(10);
        var repository = new FakeAnswerRepository(CreateAnswer(TestIds.Id(10), "member-a"));
        var service = new AnswerService(repository, new FakeTopicRepository(topic), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        await service.AcceptAsync(TestIds.Id(1), TestIds.Id(10), topic.AuthorId, CancellationToken.None);

        Assert.Empty(repository.ReputationChanges);
    }

    [Fact]
    public async Task AcceptAsync_GivesNoBonusForTheOwnAnswerOfTheQuestionAuthor()
    {
        var topic = CreateTopic();
        var repository = new FakeAnswerRepository(CreateAnswer(TestIds.Id(10), topic.AuthorId));
        var service = new AnswerService(repository, new FakeTopicRepository(topic), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        await service.AcceptAsync(TestIds.Id(1), TestIds.Id(10), topic.AuthorId, CancellationToken.None);

        Assert.Empty(repository.ReputationChanges);
    }

    [Fact]
    public async Task AcceptAsync_RejectsAnotherMemberWithoutChangingSolution()
    {
        var topic = CreateTopic();
        topic.AcceptedAnswerId = TestIds.Id(9);
        var service = new AnswerService(new FakeAnswerRepository(CreateAnswer(TestIds.Id(10), "member-a")),
            new FakeTopicRepository(topic), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        var result = await service.AcceptAsync(TestIds.Id(1), TestIds.Id(10), "another-member", CancellationToken.None);

        Assert.Equal(AcceptAnswerFailure.NotFound, result.Failure);
        Assert.Equal(TestIds.Id(9), topic.AcceptedAnswerId);
    }

    [Fact]
    public async Task AcceptAsync_OwnerCanReplaceSolution()
    {
        var topic = CreateTopic();
        topic.AcceptedAnswerId = TestIds.Id(9);
        var service = new AnswerService(new FakeAnswerRepository(CreateAnswer(TestIds.Id(10), "member-a")),
            new FakeTopicRepository(topic), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        var result = await service.AcceptAsync(TestIds.Id(1), TestIds.Id(10), topic.AuthorId, CancellationToken.None);

        Assert.Equal(AcceptAnswerFailure.None, result.Failure);
        Assert.Equal(TestIds.Id(10), topic.AcceptedAnswerId);
    }

    [Theory]
    [InlineData(true, false)]
    [InlineData(false, true)]
    public async Task AcceptAsync_RejectsDraftOrHiddenQuestion(bool draft, bool hidden)
    {
        var topic = CreateTopic();
        topic.Status = draft ? TopicStatus.Draft : TopicStatus.Published;
        topic.IsHiddenByModerator = hidden;
        var service = new AnswerService(new FakeAnswerRepository(CreateAnswer(TestIds.Id(10), "member-a")),
            new FakeTopicRepository(topic), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        var result = await service.AcceptAsync(TestIds.Id(1), TestIds.Id(10), topic.AuthorId, CancellationToken.None);

        Assert.Equal(AcceptAnswerFailure.NotFound, result.Failure);
        Assert.Null(topic.AcceptedAnswerId);
    }

    [Fact]
    public async Task AcceptAsync_RejectsNestedReply()
    {
        var topic = CreateTopic();
        var reply = CreateAnswer(TestIds.Id(11), "member-a");
        reply.ParentAnswerId = TestIds.Id(10);
        var service = new AnswerService(new FakeAnswerRepository(reply),
            new FakeTopicRepository(topic), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        var result = await service.AcceptAsync(TestIds.Id(1), TestIds.Id(11), topic.AuthorId, CancellationToken.None);

        Assert.Equal(AcceptAnswerFailure.NotFound, result.Failure);
        Assert.Null(topic.AcceptedAnswerId);
    }

    [Fact]
    public async Task CreateAsync_WhenReplyingToReply_NormalizesToRootAnswer()
    {
        var root = CreateAnswer(TestIds.Id(10), "member-root");
        var child = CreateAnswer(TestIds.Id(11), "member-child");
        child.ParentAnswerId = root.Id;
        child.ParentAnswer = root;
        var answerRepository = new FakeAnswerRepository(root, child);
        var notificationService = new FakeNotificationService();
        var service = new AnswerService(
            answerRepository,
            new FakeTopicRepository(CreateTopic()),
            notificationService,
            new PlainTextSanitizer(),
            TimeProvider.System);

        var result = await service.CreateAsync(
            TestIds.Id(1),
            "member-reply",
            new CreateAnswerRequest("<p>Phản hồi</p>", child.Id),
            CancellationToken.None);

        Assert.Equal(CreateAnswerFailure.None, result.Failure);
        Assert.Equal(root.Id, result.Answer?.ParentAnswerId);
        Assert.Equal("member-root", result.Answer?.ReplyingTo?.Id);
        Assert.Equal("member-root", notificationService.RecipientId);
    }

    [Fact]
    public async Task GetPublicPageAsync_HelpfulSortAndViewer_AreForwardedWithoutChangingLinkedPage()
    {
        var answer = CreateAnswer(TestIds.Id(12), "answer-author");
        var repository = new FakeAnswerRepository(answer)
        {
            PageResult = new AnswerPage([answer], 21, 2)
        };
        repository.Votes.Add((TestIds.Id(12), "viewer"));
        repository.Votes.Add((TestIds.Id(12), "other-member"));
        var service = CreateService(repository);

        var page = await service.GetPublicPageAsync(TestIds.Id(1),
            new AnswerQuery { Sort = "helpful", AroundAnswerId = TestIds.Id(12) }, CancellationToken.None, "viewer");

        Assert.NotNull(page);
        Assert.Equal("helpful", repository.LastSort);
        Assert.Equal(TestIds.Id(12), repository.LastAroundAnswerId);
        Assert.Equal(2, page.Page);
        var result = Assert.Single(page.Items);
        Assert.Equal(2, result.HelpfulCount);
        Assert.True(result.IsHelpful);
    }

    [Fact]
    public async Task GetPublicPageAsync_GuestAndOtherMember_DoNotReceiveAnotherMembersVoteState()
    {
        var answer = CreateAnswer(TestIds.Id(12), "answer-author");
        var repository = new FakeAnswerRepository(answer) { PageResult = new AnswerPage([answer], 1, 1) };
        repository.Votes.Add((TestIds.Id(12), "voter"));
        var service = CreateService(repository);

        var guestPage = await service.GetPublicPageAsync(TestIds.Id(1), new AnswerQuery(), CancellationToken.None);
        var memberPage = await service.GetPublicPageAsync(TestIds.Id(1), new AnswerQuery(), CancellationToken.None, "another-member");

        Assert.Equal(1, Assert.Single(guestPage!.Items).HelpfulCount);
        Assert.False(Assert.Single(guestPage.Items).IsHelpful);
        Assert.False(Assert.Single(memberPage!.Items).IsHelpful);
    }

    [Fact]
    public async Task SetHelpfulAsync_PutAndDeleteAreIdempotent_AndDoNotAcceptTheAnswer()
    {
        var topic = CreateTopic();
        var repository = new FakeAnswerRepository(CreateAnswer(TestIds.Id(12), "answer-author"));
        var service = CreateService(repository, topic);

        var first = await service.SetHelpfulAsync(TestIds.Id(1), TestIds.Id(12), "voter", true, CancellationToken.None);
        var repeated = await service.SetHelpfulAsync(TestIds.Id(1), TestIds.Id(12), "voter", true, CancellationToken.None);
        var another = await service.SetHelpfulAsync(TestIds.Id(1), TestIds.Id(12), "another-voter", true, CancellationToken.None);
        var removed = await service.SetHelpfulAsync(TestIds.Id(1), TestIds.Id(12), "voter", false, CancellationToken.None);
        var repeatedRemoval = await service.SetHelpfulAsync(TestIds.Id(1), TestIds.Id(12), "voter", false, CancellationToken.None);

        Assert.Equal(new AnswerHelpfulDto(1, true), first.Status);
        Assert.Equal(first.Status, repeated.Status);
        Assert.Equal(new AnswerHelpfulDto(2, true), another.Status);
        Assert.Equal(new AnswerHelpfulDto(1, false), removed.Status);
        Assert.Equal(removed.Status, repeatedRemoval.Status);
        Assert.Single(repository.Votes);
        Assert.Null(topic.AcceptedAnswerId);
    }

    [Fact]
    public async Task SetHelpfulAsync_RejectsOwnAnswer_WithoutChangingVotes()
    {
        var repository = new FakeAnswerRepository(CreateAnswer(TestIds.Id(12), "answer-author"));

        var result = await CreateService(repository).SetHelpfulAsync(
            TestIds.Id(1), TestIds.Id(12), "answer-author", true, CancellationToken.None);

        Assert.Equal(AnswerHelpfulFailure.OwnAnswer, result.Failure);
        Assert.Empty(repository.Votes);
        Assert.Equal(0, repository.HelpfulMutations);
    }

    [Theory]
    [InlineData(true, false, false)]
    [InlineData(false, true, false)]
    [InlineData(false, false, true)]
    public async Task SetHelpfulAsync_NonPublicTopic_CannotBeVoted(bool draft, bool hidden, bool deleted)
    {
        var topic = CreateTopic();
        topic.Status = draft ? TopicStatus.Draft : TopicStatus.Published;
        topic.IsHiddenByModerator = hidden;
        topic.IsDeleted = deleted;
        var repository = new FakeAnswerRepository(CreateAnswer(TestIds.Id(12), "answer-author"));

        var result = await CreateService(repository, topic).SetHelpfulAsync(
            TestIds.Id(1), TestIds.Id(12), "voter", true, CancellationToken.None);

        Assert.Equal(AnswerHelpfulFailure.NotFound, result.Failure);
        Assert.Equal(0, repository.HelpfulMutations);
        Assert.Equal(0, repository.VisibleCallCount);
    }

    [Theory]
    [InlineData(true, false)]
    [InlineData(false, true)]
    public async Task SetHelpfulAsync_NonPublicAnswer_CannotBeVoted(bool hidden, bool deleted)
    {
        var answer = CreateAnswer(TestIds.Id(12), "answer-author");
        answer.IsHiddenByModerator = hidden;
        answer.IsDeleted = deleted;
        var repository = new FakeAnswerRepository(answer);

        var result = await CreateService(repository).SetHelpfulAsync(
            TestIds.Id(1), TestIds.Id(12), "voter", true, CancellationToken.None);

        Assert.Equal(AnswerHelpfulFailure.NotFound, result.Failure);
        Assert.Equal(0, repository.HelpfulMutations);
    }

    [Fact]
    public async Task AcceptAsync_ReturnsExistingHelpfulCountAndOwnersVote()
    {
        var topic = CreateTopic();
        var repository = new FakeAnswerRepository(CreateAnswer(TestIds.Id(12), "answer-author"));
        repository.Votes.Add((TestIds.Id(12), topic.AuthorId));

        var result = await CreateService(repository, topic).AcceptAsync(
            TestIds.Id(1), TestIds.Id(12), topic.AuthorId, CancellationToken.None);

        Assert.True(result.Answer!.IsAccepted);
        Assert.True(result.Answer.IsHelpful);
        Assert.Equal(1, result.Answer.HelpfulCount);
    }

    [Fact]
    public async Task UpdateAsync_PreservesVotesWhileEditingAnswer()
    {
        var topic = CreateTopic();
        var answer = CreateAnswer(TestIds.Id(12), "answer-author");
        answer.Topic = topic;
        var repository = new FakeAnswerRepository(answer);
        repository.Votes.Add((TestIds.Id(12), "voter"));

        var result = await CreateService(repository, topic).UpdateAsync(
            TestIds.Id(1), TestIds.Id(12), "answer-author", new CreateAnswerRequest("<p>Đã sửa</p>"), CancellationToken.None);

        Assert.Equal(UpdateAnswerFailure.None, result.Failure);
        Assert.Equal(1, result.Answer!.HelpfulCount);
        Assert.False(result.Answer.IsHelpful);
        Assert.Equal("<p>Đã sửa</p>", result.Answer.BodyHtml);
    }

    private static AnswerService CreateService(FakeAnswerRepository repository, Topic? topic = null) =>
        new(repository, new FakeTopicRepository(topic ?? CreateTopic()), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

    private static Topic CreateTopic()
    {
        var author = CreateUser("topic-author");
        return new Topic
        {
            Id = TestIds.Id(1),
            Title = "Chủ đề kiểm thử",
            Slug = "chu-de-kiem-thu",
            Summary = "Tóm tắt",
            BodyHtml = "<p>Nội dung</p>",
            Type = TopicType.Question,
            Status = TopicStatus.Published,
            CategoryId = TestIds.Id(1),
            AuthorId = author.Id,
            Author = author,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            PublishedAtUtc = DateTimeOffset.UtcNow
        };
    }

    private static Answer CreateAnswer(Guid id, string authorId) => new()
    {
        Id = id,
        TopicId = TestIds.Id(1),
        AuthorId = authorId,
        Author = CreateUser(authorId),
        BodyHtml = "<p>Nội dung</p>",
        CreatedAtUtc = DateTimeOffset.UtcNow
    };

    private static ApplicationUser CreateUser(string id) => new()
    {
        Id = id,
        UserName = $"{id}@techforum.local",
        Email = $"{id}@techforum.local",
        DisplayName = id,
        CreatedAtUtc = DateTimeOffset.UtcNow
    };

    private sealed class PlainTextSanitizer : IContentSanitizer
    {
        public string Sanitize(string html) => html;
    }

    private sealed class FakeAnswerRepository(params Answer[] answers) : IAnswerRepository
    {
        private readonly Dictionary<Guid, Answer> items = answers.ToDictionary(answer => answer.Id);
        public AnswerPage? PageResult { get; init; } = new([], 0, 1);
        public Guid? LastAroundAnswerId { get; private set; }
        public int PageCallCount { get; private set; }
        public string? LastSort { get; private set; }
        public int VisibleCallCount { get; private set; }
        public int HelpfulMutations { get; private set; }
        public HashSet<(Guid AnswerId, string UserId)> Votes { get; } = [];
        public List<(string UserId, int Delta)> ReputationChanges { get; } = [];

        public Task AdjustReputationAsync(string userId, int delta, CancellationToken cancellationToken)
        {
            ReputationChanges.Add((userId, delta));
            return Task.CompletedTask;
        }

        public Task<Answer?> GetVisibleByIdAsync(Guid topicId, Guid answerId, CancellationToken cancellationToken)
        {
            VisibleCallCount++;
            var answer = items.GetValueOrDefault(answerId);
            return Task.FromResult(answer is { IsDeleted: false, IsHiddenByModerator: false } && answer.TopicId == topicId
                ? answer : null);
        }

        public Task AddAsync(Answer answer, CancellationToken cancellationToken)
        {
            answer.Id = TestIds.Id(20);
            answer.Author = CreateUser(answer.AuthorId);
            return Task.CompletedTask;
        }

        public Task<AnswerPage?> GetPublicPageAsync(Guid topicId, int page, int pageSize, Guid? aroundAnswerId, string sort, CancellationToken cancellationToken)
        {
            PageCallCount++;
            LastAroundAnswerId = aroundAnswerId;
            LastSort = sort;
            return Task.FromResult(PageResult);
        }
        public Task<IReadOnlyList<AnswerHelpfulState>> GetHelpfulStatesAsync(IReadOnlyCollection<Guid> answerIds, string? viewerId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<AnswerHelpfulState>>(answerIds.Select(answerId => new AnswerHelpfulState(
                answerId, Votes.Count(vote => vote.AnswerId == answerId),
                viewerId != null && Votes.Contains((answerId, viewerId)),
                // Like the real repository: the vote score of the answer.
                items.TryGetValue(answerId, out var answer) ? answer.Score : 0)).ToList());
        public Task AddHelpfulIfMissingAsync(AnswerHelpfulVote vote, CancellationToken cancellationToken)
        {
            HelpfulMutations++;
            Votes.Add((vote.AnswerId, vote.UserId));
            return Task.CompletedTask;
        }
        public Task RemoveHelpfulAsync(Guid answerId, string userId, CancellationToken cancellationToken)
        {
            HelpfulMutations++;
            Votes.Remove((answerId, userId));
            return Task.CompletedTask;
        }
        public Task<Answer?> GetOwnedByIdAsync(Guid topicId, Guid answerId, string authorId, CancellationToken cancellationToken)
        {
            var answer = items.GetValueOrDefault(answerId);
            return Task.FromResult(answer?.TopicId == topicId && answer.AuthorId == authorId && !answer.IsDeleted ? answer : null);
        }
        public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class FakeTopicRepository(Topic topic) : ITopicRepository
    {
        public Task<Topic?> GetPublicByIdAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult(id == topic.Id && topic.Status == TopicStatus.Published &&
                topic.PublishedAtUtc is not null && !topic.IsDeleted && !topic.IsHiddenByModerator ? topic : null);
        public Task<Topic?> GetOwnedByIdAsync(Guid id, string authorId, CancellationToken cancellationToken) =>
            Task.FromResult(id == topic.Id && authorId == topic.AuthorId && !topic.IsDeleted ? topic : null);
        public Task<TopicPage> GetPublicPageAsync(TopicQuery query, CancellationToken cancellationToken) => Task.FromResult(new TopicPage([], 0));
        public Task<TopicPage> GetFollowingPageAsync(string followerId, TopicQuery query, CancellationToken cancellationToken) => Task.FromResult(new TopicPage([], 0));
        public Task<TopicPage> GetOwnedPageAsync(string authorId, TopicQuery query, CancellationToken cancellationToken) => Task.FromResult(new TopicPage([], 0));
        public Task<Category?> GetCategoryByIdAsync(Guid id, CancellationToken cancellationToken) => Task.FromResult<Category?>(null);
        public Task<IReadOnlyList<Tag>> GetActiveTagsByIdsAsync(IReadOnlyCollection<Guid> ids, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Tag>>([]);
        public Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> HasPublicAnswersAsync(Guid topicId, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> TryAddAsync(Topic topic, CancellationToken cancellationToken) => Task.FromResult(true);
        public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class FakeNotificationService : INotificationService
    {
        public string? RecipientId { get; private set; }
        public Task AddNewAnswerAsync(string recipientId, Guid topicId, Guid answerId, string answerAuthorName, string topicTitle, CancellationToken cancellationToken)
        {
            RecipientId = recipientId;
            return Task.CompletedTask;
        }
        public Task AddAcceptedAnswerAsync(string recipientId, Guid topicId, Guid answerId, string topicTitle, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task<NotificationPageDto> GetPageAsync(string userId, int page, int pageSize, CancellationToken cancellationToken) => Task.FromResult(new NotificationPageDto([], page, pageSize, 0, 0, 0));
        public Task<bool> MarkReadAsync(Guid id, string userId, CancellationToken cancellationToken) => Task.FromResult(false);
    }
}
