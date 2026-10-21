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
        topic.AcceptedAnswerId = 10;
        var answerRepository = new FakeAnswerRepository
        {
            PageResult = new AnswerPage([CreateAnswer(10, "member-a")], 1, 1)
        };
        var service = new AnswerService(answerRepository,
            new FakeTopicRepository(topic), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        var result = await service.GetPublicPageAsync(1, new AnswerQuery(), CancellationToken.None);

        Assert.NotNull(result);
        Assert.False(Assert.Single(result.Items).IsAccepted);
    }

    [Fact]
    public async Task GetPublicPageAsync_UsesPageContainingLinkedAnswer()
    {
        var answerRepository = new FakeAnswerRepository
        {
            PageResult = new AnswerPage([CreateAnswer(41, "member-a")], 41, 3)
        };
        var service = new AnswerService(answerRepository,
            new FakeTopicRepository(CreateTopic()), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        var result = await service.GetPublicPageAsync(1,
            new AnswerQuery { Page = 1, PageSize = 20, AroundAnswerId = 41 }, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(41, answerRepository.LastAroundAnswerId);
        Assert.Equal(3, result.Page);
        Assert.Equal(3, result.TotalPages);
        Assert.Equal(41, Assert.Single(result.Items).Id);
    }

    [Fact]
    public async Task GetPublicPageAsync_WhenLinkedAnswerUnavailable_ReturnsNotFound()
    {
        var answerRepository = new FakeAnswerRepository { PageResult = null };
        var service = new AnswerService(answerRepository,
            new FakeTopicRepository(CreateTopic()), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        var result = await service.GetPublicPageAsync(1,
            new AnswerQuery { AroundAnswerId = 41 }, CancellationToken.None);

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

        var result = await service.GetPublicPageAsync(1,
            new AnswerQuery { AroundAnswerId = 41 }, CancellationToken.None);

        Assert.Null(result);
        Assert.Equal(0, answerRepository.PageCallCount);
    }

    [Fact]
    public async Task AcceptAsync_RejectsAnotherMemberWithoutChangingSolution()
    {
        var topic = CreateTopic();
        topic.AcceptedAnswerId = 9;
        var service = new AnswerService(new FakeAnswerRepository(CreateAnswer(10, "member-a")),
            new FakeTopicRepository(topic), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        var result = await service.AcceptAsync(1, 10, "another-member", CancellationToken.None);

        Assert.Equal(AcceptAnswerFailure.NotFound, result.Failure);
        Assert.Equal(9, topic.AcceptedAnswerId);
    }

    [Fact]
    public async Task AcceptAsync_OwnerCanReplaceSolution()
    {
        var topic = CreateTopic();
        topic.AcceptedAnswerId = 9;
        var service = new AnswerService(new FakeAnswerRepository(CreateAnswer(10, "member-a")),
            new FakeTopicRepository(topic), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        var result = await service.AcceptAsync(1, 10, topic.AuthorId, CancellationToken.None);

        Assert.Equal(AcceptAnswerFailure.None, result.Failure);
        Assert.Equal(10, topic.AcceptedAnswerId);
    }

    [Theory]
    [InlineData(true, false)]
    [InlineData(false, true)]
    public async Task AcceptAsync_RejectsDraftOrHiddenQuestion(bool draft, bool hidden)
    {
        var topic = CreateTopic();
        topic.Status = draft ? TopicStatus.Draft : TopicStatus.Published;
        topic.IsHiddenByModerator = hidden;
        var service = new AnswerService(new FakeAnswerRepository(CreateAnswer(10, "member-a")),
            new FakeTopicRepository(topic), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        var result = await service.AcceptAsync(1, 10, topic.AuthorId, CancellationToken.None);

        Assert.Equal(AcceptAnswerFailure.NotFound, result.Failure);
        Assert.Null(topic.AcceptedAnswerId);
    }

    [Fact]
    public async Task AcceptAsync_RejectsNestedReply()
    {
        var topic = CreateTopic();
        var reply = CreateAnswer(11, "member-a");
        reply.ParentAnswerId = 10;
        var service = new AnswerService(new FakeAnswerRepository(reply),
            new FakeTopicRepository(topic), new FakeNotificationService(),
            new PlainTextSanitizer(), TimeProvider.System);

        var result = await service.AcceptAsync(1, 11, topic.AuthorId, CancellationToken.None);

        Assert.Equal(AcceptAnswerFailure.NotFound, result.Failure);
        Assert.Null(topic.AcceptedAnswerId);
    }

    [Fact]
    public async Task CreateAsync_WhenReplyingToReply_NormalizesToRootAnswer()
    {
        var root = CreateAnswer(10, "member-root");
        var child = CreateAnswer(11, "member-child");
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
            1,
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
        var answer = CreateAnswer(12, "answer-author");
        var repository = new FakeAnswerRepository(answer)
        {
            PageResult = new AnswerPage([answer], 21, 2)
        };
        repository.Votes.Add((12, "viewer"));
        repository.Votes.Add((12, "other-member"));
        var service = CreateService(repository);

        var page = await service.GetPublicPageAsync(1,
            new AnswerQuery { Sort = "helpful", AroundAnswerId = 12 }, CancellationToken.None, "viewer");

        Assert.NotNull(page);
        Assert.Equal("helpful", repository.LastSort);
        Assert.Equal(12, repository.LastAroundAnswerId);
        Assert.Equal(2, page.Page);
        var result = Assert.Single(page.Items);
        Assert.Equal(2, result.HelpfulCount);
        Assert.True(result.IsHelpful);
    }

    [Fact]
    public async Task GetPublicPageAsync_GuestAndOtherMember_DoNotReceiveAnotherMembersVoteState()
    {
        var answer = CreateAnswer(12, "answer-author");
        var repository = new FakeAnswerRepository(answer) { PageResult = new AnswerPage([answer], 1, 1) };
        repository.Votes.Add((12, "voter"));
        var service = CreateService(repository);

        var guestPage = await service.GetPublicPageAsync(1, new AnswerQuery(), CancellationToken.None);
        var memberPage = await service.GetPublicPageAsync(1, new AnswerQuery(), CancellationToken.None, "another-member");

        Assert.Equal(1, Assert.Single(guestPage!.Items).HelpfulCount);
        Assert.False(Assert.Single(guestPage.Items).IsHelpful);
        Assert.False(Assert.Single(memberPage!.Items).IsHelpful);
    }

    [Fact]
    public async Task SetHelpfulAsync_PutAndDeleteAreIdempotent_AndDoNotAcceptTheAnswer()
    {
        var topic = CreateTopic();
        var repository = new FakeAnswerRepository(CreateAnswer(12, "answer-author"));
        var service = CreateService(repository, topic);

        var first = await service.SetHelpfulAsync(1, 12, "voter", true, CancellationToken.None);
        var repeated = await service.SetHelpfulAsync(1, 12, "voter", true, CancellationToken.None);
        var another = await service.SetHelpfulAsync(1, 12, "another-voter", true, CancellationToken.None);
        var removed = await service.SetHelpfulAsync(1, 12, "voter", false, CancellationToken.None);
        var repeatedRemoval = await service.SetHelpfulAsync(1, 12, "voter", false, CancellationToken.None);

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
        var repository = new FakeAnswerRepository(CreateAnswer(12, "answer-author"));

        var result = await CreateService(repository).SetHelpfulAsync(
            1, 12, "answer-author", true, CancellationToken.None);

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
        var repository = new FakeAnswerRepository(CreateAnswer(12, "answer-author"));

        var result = await CreateService(repository, topic).SetHelpfulAsync(
            1, 12, "voter", true, CancellationToken.None);

        Assert.Equal(AnswerHelpfulFailure.NotFound, result.Failure);
        Assert.Equal(0, repository.HelpfulMutations);
        Assert.Equal(0, repository.VisibleCallCount);
    }

    [Theory]
    [InlineData(true, false)]
    [InlineData(false, true)]
    public async Task SetHelpfulAsync_NonPublicAnswer_CannotBeVoted(bool hidden, bool deleted)
    {
        var answer = CreateAnswer(12, "answer-author");
        answer.IsHiddenByModerator = hidden;
        answer.IsDeleted = deleted;
        var repository = new FakeAnswerRepository(answer);

        var result = await CreateService(repository).SetHelpfulAsync(
            1, 12, "voter", true, CancellationToken.None);

        Assert.Equal(AnswerHelpfulFailure.NotFound, result.Failure);
        Assert.Equal(0, repository.HelpfulMutations);
    }

    [Fact]
    public async Task AcceptAsync_ReturnsExistingHelpfulCountAndOwnersVote()
    {
        var topic = CreateTopic();
        var repository = new FakeAnswerRepository(CreateAnswer(12, "answer-author"));
        repository.Votes.Add((12, topic.AuthorId));

        var result = await CreateService(repository, topic).AcceptAsync(
            1, 12, topic.AuthorId, CancellationToken.None);

        Assert.True(result.Answer!.IsAccepted);
        Assert.True(result.Answer.IsHelpful);
        Assert.Equal(1, result.Answer.HelpfulCount);
    }

    [Fact]
    public async Task UpdateAsync_PreservesVotesWhileEditingAnswer()
    {
        var topic = CreateTopic();
        var answer = CreateAnswer(12, "answer-author");
        answer.Topic = topic;
        var repository = new FakeAnswerRepository(answer);
        repository.Votes.Add((12, "voter"));

        var result = await CreateService(repository, topic).UpdateAsync(
            1, 12, "answer-author", new CreateAnswerRequest("<p>Đã sửa</p>"), CancellationToken.None);

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
            Id = 1,
            Title = "Chủ đề kiểm thử",
            Slug = "chu-de-kiem-thu",
            Summary = "Tóm tắt",
            BodyHtml = "<p>Nội dung</p>",
            Type = TopicType.Question,
            Status = TopicStatus.Published,
            CategoryId = 1,
            AuthorId = author.Id,
            Author = author,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            PublishedAtUtc = DateTimeOffset.UtcNow
        };
    }

    private static Answer CreateAnswer(int id, string authorId) => new()
    {
        Id = id,
        TopicId = 1,
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
        private readonly Dictionary<int, Answer> items = answers.ToDictionary(answer => answer.Id);
        public AnswerPage? PageResult { get; init; } = new([], 0, 1);
        public int? LastAroundAnswerId { get; private set; }
        public int PageCallCount { get; private set; }
        public string? LastSort { get; private set; }
        public int VisibleCallCount { get; private set; }
        public int HelpfulMutations { get; private set; }
        public HashSet<(int AnswerId, string UserId)> Votes { get; } = [];

        public Task<Answer?> GetVisibleByIdAsync(int topicId, int answerId, CancellationToken cancellationToken)
        {
            VisibleCallCount++;
            var answer = items.GetValueOrDefault(answerId);
            return Task.FromResult(answer is { IsDeleted: false, IsHiddenByModerator: false } && answer.TopicId == topicId
                ? answer : null);
        }

        public Task AddAsync(Answer answer, CancellationToken cancellationToken)
        {
            answer.Id = 20;
            answer.Author = CreateUser(answer.AuthorId);
            return Task.CompletedTask;
        }

        public Task<AnswerPage?> GetPublicPageAsync(int topicId, int page, int pageSize, int? aroundAnswerId, string sort, CancellationToken cancellationToken)
        {
            PageCallCount++;
            LastAroundAnswerId = aroundAnswerId;
            LastSort = sort;
            return Task.FromResult(PageResult);
        }
        public Task<IReadOnlyList<AnswerHelpfulState>> GetHelpfulStatesAsync(IReadOnlyCollection<int> answerIds, string? viewerId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<AnswerHelpfulState>>(answerIds.Select(answerId => new AnswerHelpfulState(
                answerId, Votes.Count(vote => vote.AnswerId == answerId),
                viewerId != null && Votes.Contains((answerId, viewerId)))).ToList());
        public Task AddHelpfulIfMissingAsync(AnswerHelpfulVote vote, CancellationToken cancellationToken)
        {
            HelpfulMutations++;
            Votes.Add((vote.AnswerId, vote.UserId));
            return Task.CompletedTask;
        }
        public Task RemoveHelpfulAsync(int answerId, string userId, CancellationToken cancellationToken)
        {
            HelpfulMutations++;
            Votes.Remove((answerId, userId));
            return Task.CompletedTask;
        }
        public Task<Answer?> GetOwnedByIdAsync(int topicId, int answerId, string authorId, CancellationToken cancellationToken)
        {
            var answer = items.GetValueOrDefault(answerId);
            return Task.FromResult(answer?.TopicId == topicId && answer.AuthorId == authorId && !answer.IsDeleted ? answer : null);
        }
        public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class FakeTopicRepository(Topic topic) : ITopicRepository
    {
        public Task<Topic?> GetPublicByIdAsync(int id, CancellationToken cancellationToken) =>
            Task.FromResult(id == topic.Id && topic.Status == TopicStatus.Published &&
                topic.PublishedAtUtc is not null && !topic.IsDeleted && !topic.IsHiddenByModerator ? topic : null);
        public Task<Topic?> GetOwnedByIdAsync(int id, string authorId, CancellationToken cancellationToken) =>
            Task.FromResult(id == topic.Id && authorId == topic.AuthorId && !topic.IsDeleted ? topic : null);
        public Task<TopicPage> GetPublicPageAsync(TopicQuery query, CancellationToken cancellationToken) => Task.FromResult(new TopicPage([], 0));
        public Task<TopicPage> GetFollowingPageAsync(string followerId, TopicQuery query, CancellationToken cancellationToken) => Task.FromResult(new TopicPage([], 0));
        public Task<TopicPage> GetOwnedPageAsync(string authorId, TopicQuery query, CancellationToken cancellationToken) => Task.FromResult(new TopicPage([], 0));
        public Task<Category?> GetCategoryByIdAsync(int id, CancellationToken cancellationToken) => Task.FromResult<Category?>(null);
        public Task<IReadOnlyList<Tag>> GetActiveTagsByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Tag>>([]);
        public Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> HasPublicAnswersAsync(int topicId, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task AddAsync(Topic topic, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class FakeNotificationService : INotificationService
    {
        public string? RecipientId { get; private set; }
        public Task AddNewAnswerAsync(string recipientId, int topicId, int answerId, string answerAuthorName, string topicTitle, CancellationToken cancellationToken)
        {
            RecipientId = recipientId;
            return Task.CompletedTask;
        }
        public Task AddAcceptedAnswerAsync(string recipientId, int topicId, int answerId, string topicTitle, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task<NotificationPageDto> GetPageAsync(string userId, int page, int pageSize, CancellationToken cancellationToken) => Task.FromResult(new NotificationPageDto([], page, pageSize, 0, 0, 0));
        public Task<bool> MarkReadAsync(long id, string userId, CancellationToken cancellationToken) => Task.FromResult(false);
    }
}
