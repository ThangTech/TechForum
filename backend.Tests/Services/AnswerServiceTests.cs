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

        public Task<Answer?> GetVisibleByIdAsync(int topicId, int answerId, CancellationToken cancellationToken) =>
            Task.FromResult(items.GetValueOrDefault(answerId));

        public Task AddAsync(Answer answer, CancellationToken cancellationToken)
        {
            answer.Id = 20;
            answer.Author = CreateUser(answer.AuthorId);
            return Task.CompletedTask;
        }

        public Task<AnswerPage> GetPublicPageAsync(int topicId, int page, int pageSize, CancellationToken cancellationToken) =>
            Task.FromResult(new AnswerPage([], 0));
        public Task<Answer?> GetOwnedByIdAsync(int topicId, int answerId, string authorId, CancellationToken cancellationToken) => Task.FromResult<Answer?>(null);
        public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class FakeTopicRepository(Topic topic) : ITopicRepository
    {
        public Task<Topic?> GetPublicByIdAsync(int id, CancellationToken cancellationToken) => Task.FromResult<Topic?>(topic);
        public Task<Topic?> GetOwnedByIdAsync(int id, string authorId, CancellationToken cancellationToken) => Task.FromResult<Topic?>(null);
        public Task<TopicPage> GetPublicPageAsync(TopicQuery query, CancellationToken cancellationToken) => Task.FromResult(new TopicPage([], 0));
        public Task<TopicPage> GetOwnedPageAsync(string authorId, TopicQuery query, CancellationToken cancellationToken) => Task.FromResult(new TopicPage([], 0));
        public Task<Category?> GetCategoryByIdAsync(int id, CancellationToken cancellationToken) => Task.FromResult<Category?>(null);
        public Task<IReadOnlyList<Tag>> GetActiveTagsByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Tag>>([]);
        public Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken) => Task.FromResult(false);
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
