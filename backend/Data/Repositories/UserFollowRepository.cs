using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TechForum.Api.Models;
using TechForum.Api.Enums;

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

    public async Task<FollowMemberPage?> GetConnectionsAsync(
        string userId,
        bool followers,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        if (!await UserExistsAsync(userId, cancellationToken)) return null;

        var query = dbContext.UserFollows
            .AsNoTracking()
            .Where(follow => followers ? follow.FollowingId == userId : follow.FollowerId == userId)
            .Select(follow => new
            {
                User = followers ? follow.Follower : follow.Following,
                follow.CreatedAtUtc
            });
        var totalItems = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(item => item.CreatedAtUtc)
            .ThenBy(item => item.User.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(item => new FollowMemberData(
                item.User.Id,
                item.User.DisplayName,
                item.User.Bio,
                dbContext.Topics.Count(topic =>
                    topic.AuthorId == item.User.Id &&
                    topic.Status == TopicStatus.Published &&
                    topic.PublishedAtUtc != null &&
                    !topic.IsDeleted &&
                    !topic.IsHiddenByModerator),
                item.CreatedAtUtc))
            .ToListAsync(cancellationToken);
        return new FollowMemberPage(items, totalItems);
    }
}
