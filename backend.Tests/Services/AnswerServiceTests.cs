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

        public Task<Answer?> GetVisibleByIdAsync(int topicId, int answerId, CancellationToken cancellationToken) =>
            Task.FromResult(items.GetValueOrDefault(answerId));

        public Task AddAsync(Answer answer, CancellationToken cancellationToken)
        {
            answer.Id = 20;
            answer.Author = CreateUser(answer.AuthorId);
            return Task.CompletedTask;
        }

        public Task<AnswerPage?> GetPublicPageAsync(int topicId, int page, int pageSize, int? aroundAnswerId, CancellationToken cancellationToken)
        {
            PageCallCount++;
            LastAroundAnswerId = aroundAnswerId;
            return Task.FromResult(PageResult);
        }
        public Task<Answer?> GetOwnedByIdAsync(int topicId, int answerId, string authorId, CancellationToken cancellationToken) => Task.FromResult<Answer?>(null);
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
