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
        var memberGroups = topics
            .GroupBy(item => new { item.Topic.AuthorId, item.Topic.Author.DisplayName });
        var memberCount = await memberGroups.CountAsync(cancellationToken);
        var members = await memberGroups
            .OrderByDescending(group => group.Count())
            .ThenBy(group => group.Key.DisplayName)
            .ThenBy(group => group.Key.AuthorId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(group => new SkillMemberData(
                group.Key.AuthorId,
                group.Key.DisplayName,
                group.Count()))
            .ToListAsync(cancellationToken);
        return new SkillCommunityData(tag, topicCount, memberCount, members);
    }
}
