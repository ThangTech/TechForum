using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class UserFollowService(
    IUserFollowRepository repository,
    TimeProvider timeProvider) : IUserFollowService
{
    public async Task<UserFollowResult> FollowAsync(
        string followerId,
        string followingId,
        CancellationToken cancellationToken)
    {
        if (followerId == followingId) return UserFollowResult.Failed(FollowFailure.SelfFollow);
        if (!await repository.UserExistsAsync(followingId, cancellationToken))
            return UserFollowResult.Failed(FollowFailure.NotFound);
        await repository.AddIfMissingAsync(new UserFollow
        {
            FollowerId = followerId,
            FollowingId = followingId,
            CreatedAtUtc = timeProvider.GetUtcNow()
        }, cancellationToken);
        return UserFollowResult.Success(new FollowStatusDto(
            true,
            await repository.GetFollowerCountAsync(followingId, cancellationToken)));
    }

    public async Task<FollowStatusDto> UnfollowAsync(
        string followerId,
        string followingId,
        CancellationToken cancellationToken)
    {
        await repository.RemoveAsync(followerId, followingId, cancellationToken);
        return new FollowStatusDto(
            false,
            await repository.GetFollowerCountAsync(followingId, cancellationToken));
    }

    public async Task<PagedResultDto<FollowMemberDto>?> GetConnectionsAsync(
        string userId,
        bool followers,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var result = await repository.GetConnectionsAsync(
            userId, followers, page, pageSize, cancellationToken);
        if (result is null) return null;
        var totalPages = result.TotalItems == 0
            ? 0
            : (int)Math.Ceiling(result.TotalItems / (double)pageSize);
        return new PagedResultDto<FollowMemberDto>(
            result.Items.Select(item => new FollowMemberDto(
                item.Id,
                item.DisplayName,
                item.Bio,
                item.PublishedTopicCount,
                item.FollowedAtUtc)).ToList(),
            page,
            pageSize,
            result.TotalItems,
            totalPages);
    }
}
