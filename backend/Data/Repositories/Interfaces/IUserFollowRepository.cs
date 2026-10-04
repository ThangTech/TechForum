using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IUserFollowRepository
{
    Task<bool> UserExistsAsync(string userId, CancellationToken cancellationToken);
    Task<bool> AddIfMissingAsync(UserFollow follow, CancellationToken cancellationToken);
    Task RemoveAsync(string followerId, string followingId, CancellationToken cancellationToken);
    Task<int> GetFollowerCountAsync(string userId, CancellationToken cancellationToken);
    Task<FollowMemberPage?> GetConnectionsAsync(
        string userId,
        bool followers,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}
