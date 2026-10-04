using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IUserFollowService
{
    Task<UserFollowResult> FollowAsync(string followerId, string followingId, CancellationToken cancellationToken);
    Task<FollowStatusDto> UnfollowAsync(string followerId, string followingId, CancellationToken cancellationToken);
    Task<PagedResultDto<FollowMemberDto>?> GetConnectionsAsync(
        string userId,
        bool followers,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}
