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
        var service = new UserFollowService(new FakeRepository(), TimeProvider.System);

        var result = await service.FollowAsync("member", "member", CancellationToken.None);

        Assert.Equal(FollowFailure.SelfFollow, result.Failure);
    }

    [Fact]
    public async Task FollowAsync_WhenTargetExists_ReturnsCurrentCount()
    {
        var repository = new FakeRepository { UserExists = true, FollowerCount = 3 };
        var service = new UserFollowService(repository, TimeProvider.System);

        var result = await service.FollowAsync("member-a", "member-b", CancellationToken.None);

        Assert.Equal(FollowFailure.None, result.Failure);
        Assert.True(result.Status?.IsFollowing);
        Assert.Equal(3, result.Status?.FollowerCount);
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
        var service = new UserFollowService(repository, TimeProvider.System);

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
}
