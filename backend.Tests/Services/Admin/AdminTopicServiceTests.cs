using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;
using TechForum.Api.Services;
using TechForum.Api.Tests.Fakes;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class AdminTopicServiceTests
{
    [Fact]
    public async Task Hide_RepeatedActionDoesNotNotifyAgain()
    {
        var repository = new FakeTopics();
        var service = new AdminTopicService(repository, TestMediaRules.CreateSanitizer(), TimeProvider.System);
        var first = await service.ModerateAsync(TestIds.Id(1), "admin", new("hide", null, "Quảng cáo lặp lại"), default);
        var second = await service.ModerateAsync(TestIds.Id(1), "admin", new("hide", null, "Quảng cáo lặp lại"), default);

        Assert.Equal(AdminTopicWriteFailure.None, first.Failure);
        Assert.Equal(AdminTopicWriteFailure.None, second.Failure);
        Assert.Equal(1, repository.SaveCount);
        var notification = Assert.Single(repository.Notifications);
        Assert.Equal("author", notification.UserId);
        Assert.Contains("Quảng cáo lặp lại", notification.Message);
        Assert.Equal("/notifications", notification.Link);
    }

    [Fact]
    public async Task Moderate_ConcurrentChangeReturnsConflict()
    {
        var repository = new FakeTopics { CanSave = false };
        var result = await new AdminTopicService(repository, TestMediaRules.CreateSanitizer(), TimeProvider.System)
            .ModerateAsync(TestIds.Id(1), "admin", new("lock", null, "Tạm dừng thảo luận"), default);
        Assert.Equal(AdminTopicWriteFailure.Conflict, result.Failure);
        Assert.Empty(repository.Notifications);
    }

    [Fact]
    public async Task Moderate_ReasonRequiredBeforeChangingContent()
    {
        var repository = new FakeTopics();
        var result = await new AdminTopicService(repository, TestMediaRules.CreateSanitizer(), TimeProvider.System)
            .ModerateAsync(TestIds.Id(1), "admin", new("hide", null, "  "), default);
        Assert.Equal(AdminTopicWriteFailure.Validation, result.Failure);
        Assert.Equal(0, repository.SaveCount);
    }

    private sealed class FakeTopics : IAdminTopicRepository
    {
        public bool CanSave { get; init; } = true;
        public int SaveCount { get; private set; }
        public List<Notification> Notifications { get; } = [];
        private readonly Topic topic = new()
        {
            Id = TestIds.Id(1), Title = "Chủ đề kiểm thử", Slug = "kiem-thu", Summary = "Tóm tắt", BodyHtml = "<p>Nội dung</p>",
            AuthorId = "author", Author = new() { Id = "author", DisplayName = "Tác giả" },
            CategoryId = TestIds.Id(1), Category = new() { Id = TestIds.Id(1), Name = "Chuyên mục", Slug = "chuyen-muc" },
            Status = TopicStatus.Published, PublishedAtUtc = DateTimeOffset.UtcNow
        };
        public Task<AdminTopicPage> GetPageAsync(AdminTopicQuery query, TopicType? type, CancellationToken cancellationToken) => Task.FromResult(new AdminTopicPage([topic], 1));
        public Task<Topic?> GetTrackedByIdAsync(Guid id, CancellationToken cancellationToken) => Task.FromResult<Topic?>(topic);
        public Task<Category?> GetActiveCategoryAsync(Guid id, CancellationToken cancellationToken) => Task.FromResult<Category?>(topic.Category);
        public Task<bool> SaveWithAuditAsync(AdminAuditLog auditLog, Notification? notification, CancellationToken cancellationToken)
        {
            if (!CanSave) return Task.FromResult(false);
            SaveCount++;
            if (notification is not null) Notifications.Add(notification);
            return Task.FromResult(true);
        }
    }
}
