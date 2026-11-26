using TechForum.Api.Data.Repositories;
using TechForum.Api.Models;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class UserFollowServiceTests
{
    [Fact]
    public async Task FollowAsync_WhenFollowingSelf_ReturnsConflict()
    {
        var service = new UserFollowService(new FakeRepository(), new FakeNotifications(), TimeProvider.System);

        var result = await service.FollowAsync("member", "member", CancellationToken.None);

        Assert.Equal(ErrorType.Conflict, result.Error);
    }

    [Fact]
    public async Task FollowAsync_WhenTargetExists_ReturnsCurrentCount()
    {
        var repository = new FakeRepository { UserExists = true, FollowerCount = 3 };
        var service = new UserFollowService(repository, new FakeNotifications(), TimeProvider.System);

        var result = await service.FollowAsync("member-a", "member-b", CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.True(result.Value?.IsFollowing);
        Assert.Equal(3, result.Value?.FollowerCount);
        Assert.Equal("member-a", repository.Added?.FollowerId);
        Assert.Equal("member-b", repository.Added?.FollowingId);
    }

    [Fact]
    public async Task GetConnectionsAsync_MapsPublicMemberPage()
    {
        var repository = new FakeRepository
        {
            Connections = new FollowMemberPage(
                [new FollowMemberData("member-b", "Thành viên B", "Backend", 4, DateTimeOffset.UtcNow)],
                1)
        };
        var service = new UserFollowService(repository, new FakeNotifications(), TimeProvider.System);

        var result = await service.GetConnectionsAsync(
            "member-a", false, 1, 20, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Single(result.Items);
        Assert.Equal("Thành viên B", result.Items[0].DisplayName);
        Assert.Equal(4, result.Items[0].PublishedTopicCount);
        Assert.Equal(1, result.TotalPages);
    }

    private sealed class FakeRepository : IUserFollowRepository
    {
        public bool UserExists { get; init; }
        public int FollowerCount { get; init; }
        public UserFollow? Added { get; private set; }
        public FollowMemberPage? Connections { get; init; }

        public Task<bool> UserExistsAsync(string userId, CancellationToken cancellationToken) =>
            Task.FromResult(UserExists);

        public Task<string?> GetDisplayNameAsync(string userId, CancellationToken cancellationToken) =>
            Task.FromResult<string?>("Người theo dõi");

        public Task<bool> AddIfMissingAsync(UserFollow follow, CancellationToken cancellationToken)
        {
            Added = follow;
            return Task.FromResult(true);
        }

        public Task RemoveAsync(string followerId, string followingId, CancellationToken cancellationToken) =>
            Task.CompletedTask;

        public Task<int> GetFollowerCountAsync(string userId, CancellationToken cancellationToken) =>
            Task.FromResult(FollowerCount);

        public Task<FollowMemberPage?> GetConnectionsAsync(
            string userId,
            bool followers,
            int page,
            int pageSize,
            CancellationToken cancellationToken) =>
            Task.FromResult(Connections);
    }

    [Fact]
    public async Task FollowAsync_TellsTheFollowedMemberOnce()
    {
        var notifications = new FakeNotifications();
        var service = new UserFollowService(new FakeRepository { UserExists = true }, notifications, TimeProvider.System);

        await service.FollowAsync("fan", "author", CancellationToken.None);

        var sent = Assert.Single(notifications.Followers);
        Assert.Equal(("author", "fan", "Người theo dõi"), sent);
    }

    private sealed class FakeNotifications : INotificationService
    {
        public List<(string Recipient, string Follower, string Name)> Followers { get; } = [];
        public Task AddNewFollowerAsync(string recipientId, string followerId, string followerName, CancellationToken cancellationToken)
        {
            Followers.Add((recipientId, followerId, followerName));
            return Task.CompletedTask;
        }
        public Task AddNewAnswerAsync(string recipientId, Guid topicId, Guid answerId, string answerAuthorName, string topicTitle, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task AddAcceptedAnswerAsync(string recipientId, Guid topicId, Guid answerId, string topicTitle, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task<TechForum.Api.Dtos.NotificationPageDto> GetPageAsync(string userId, int page, int pageSize, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<bool> MarkReadAsync(Guid id, string userId, CancellationToken cancellationToken) => Task.FromResult(false);
    }
}
