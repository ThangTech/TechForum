using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class UserFollowRepository(TechForumDbContext dbContext) : IUserFollowRepository
{
    public Task<bool> UserExistsAsync(string userId, CancellationToken cancellationToken) =>
        dbContext.Users.AsNoTracking().AnyAsync(user => user.Id == userId, cancellationToken);

    public async Task<bool> AddIfMissingAsync(UserFollow follow, CancellationToken cancellationToken)
    {
        if (await dbContext.UserFollows.AnyAsync(item =>
            item.FollowerId == follow.FollowerId && item.FollowingId == follow.FollowingId, cancellationToken))
            return false;
        dbContext.UserFollows.Add(follow);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            dbContext.Entry(follow).State = EntityState.Detached;
            return false;
        }
    }

    public async Task RemoveAsync(string followerId, string followingId, CancellationToken cancellationToken)
    {
        await dbContext.UserFollows
            .Where(follow => follow.FollowerId == followerId && follow.FollowingId == followingId)
            .ExecuteDeleteAsync(cancellationToken);
    }

    public Task<int> GetFollowerCountAsync(string userId, CancellationToken cancellationToken) =>
        dbContext.UserFollows.AsNoTracking().CountAsync(follow => follow.FollowingId == userId, cancellationToken);
}
