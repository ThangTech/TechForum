using Microsoft.EntityFrameworkCore;
using TechForum.Api.Enums;

namespace TechForum.Api.Data.Repositories;

public sealed class SkillCommunityRepository(TechForumDbContext dbContext) : ISkillCommunityRepository
{
    public async Task<SkillCommunityData?> GetAsync(
        int tagId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var tag = await dbContext.Tags.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == tagId && item.IsActive, cancellationToken);
        if (tag is null) return null;

        var topics = dbContext.TopicTags.AsNoTracking().Where(item =>
            item.TagId == tagId &&
            item.Topic.Status == TopicStatus.Published &&
            item.Topic.PublishedAtUtc != null &&
            !item.Topic.IsDeleted &&
            !item.Topic.IsHiddenByModerator);
        var topicCount = await topics.CountAsync(cancellationToken);
        var membersQuery = topics
            .GroupBy(item => new { item.Topic.AuthorId, item.Topic.Author.DisplayName })
            .Select(group => new SkillMemberData(
                group.Key.AuthorId,
                group.Key.DisplayName,
                group.Count()));
        var memberCount = await membersQuery.CountAsync(cancellationToken);
        var members = await membersQuery
            .OrderByDescending(item => item.TopicCount)
            .ThenBy(item => item.DisplayName)
            .ThenBy(item => item.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return new SkillCommunityData(tag, topicCount, memberCount, members);
    }
}
