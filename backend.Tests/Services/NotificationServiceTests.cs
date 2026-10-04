using TechForum.Api.Data.Repositories;
using TechForum.Api.Models;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class NotificationServiceTests
{
    private static readonly DateTimeOffset CurrentTime =
        new(2026, 10, 4, 5, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task AddNewAnswerAsync_CreatesStableNotificationAndSaves()
    {
        var repository = new FakeNotificationRepository();
        var service = new NotificationService(repository, new FixedTimeProvider(CurrentTime));

        await service.AddNewAnswerAsync(
            "topic-author",
            12,
            35,
            "Thành viên B",
            "Cách tối ưu React",
            CancellationToken.None);

        var notification = Assert.Single(repository.Added);
        Assert.Equal("topic-author", notification.UserId);
        Assert.Equal("new-answer", notification.Type);
        Assert.Equal("Thành viên B đã trả lời trong “Cách tối ưu React”.", notification.Message);
        Assert.Equal("/topics/12#answer-35", notification.Link);
        Assert.Equal("new-answer:12:35", notification.SourceKey);
        Assert.Equal(CurrentTime, notification.CreatedAtUtc);
        Assert.Equal(1, repository.SaveCount);
    }

    [Fact]
    public async Task AddNewAnswerAsync_WhenSourceExists_DoesNotSaveAgain()
    {
        var repository = new FakeNotificationRepository { ShouldAdd = false };
        var service = new NotificationService(repository, new FixedTimeProvider(CurrentTime));

        await service.AddNewAnswerAsync(
            "topic-author", 12, 35, "Thành viên B", "Chủ đề", CancellationToken.None);

        Assert.Empty(repository.Added);
        Assert.Equal(0, repository.SaveCount);
    }

    private sealed class FixedTimeProvider(DateTimeOffset currentTime) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => currentTime;
    }

    private sealed class FakeNotificationRepository : INotificationRepository
    {
        public bool ShouldAdd { get; init; } = true;
        public List<Notification> Added { get; } = [];
        public int SaveCount { get; private set; }

        public Task<NotificationPage> GetPageAsync(
            string userId,
            int page,
            int pageSize,
            CancellationToken cancellationToken) =>
            Task.FromResult(new NotificationPage([], 0, 0));

        public Task<bool> AddIfMissingAsync(
            Notification notification,
            CancellationToken cancellationToken)
        {
            if (ShouldAdd) Added.Add(notification);
            return Task.FromResult(ShouldAdd);
        }

        public Task<Notification?> GetUnreadAsync(
            long id,
            string userId,
            CancellationToken cancellationToken) =>
            Task.FromResult<Notification?>(null);

        public Task SaveChangesAsync(CancellationToken cancellationToken)
        {
            SaveCount++;
            return Task.CompletedTask;
        }
    }
}
