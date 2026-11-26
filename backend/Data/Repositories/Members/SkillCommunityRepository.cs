using Microsoft.EntityFrameworkCore;
using TechForum.Api.Enums;

namespace TechForum.Api.Data.Repositories;

public sealed class SkillCommunityRepository : ISkillCommunityRepository
{
    private readonly TechForumDbContext dbContext;

    public SkillCommunityRepository(TechForumDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    // Cùng cách đếm với trang một cộng đồng: chỉ bài công khai, thành viên là tác giả của các bài đó.
    public async Task<IReadOnlyList<CommunitySummaryData>> GetSummariesAsync(CancellationToken cancellationToken)
    {
        var tags = await dbContext.Tags.AsNoTracking().Where(tag => tag.IsActive).ToListAsync(cancellationToken);
        var counts = await dbContext.TopicTags.AsNoTracking()
            .WhereTopicIsPublic(item => item.Topic)
            .GroupBy(item => item.TagId)
            .Select(group => new
            {
                group.Key,
                Topics = group.Count(),
                Members = group.Select(item => item.Topic.AuthorId).Distinct().Count()
            })
            .ToDictionaryAsync(item => item.Key, cancellationToken);
        return tags
            .Select(tag => counts.TryGetValue(tag.Id, out var count)
                ? new CommunitySummaryData(tag, count.Topics, count.Members)
                : new CommunitySummaryData(tag, 0, 0))
            .OrderByDescending(item => item.TopicCount)
            .ThenBy(item => item.Tag.Name)
            .ToList();
    }

    public async Task<SkillCommunityData?> GetAsync(
        Guid tagId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var tag = await dbContext.Tags.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == tagId && item.IsActive, cancellationToken);
        if (tag is null)
        {
            return null;
        }

        var topics = dbContext.TopicTags.AsNoTracking()
            .Where(item => item.TagId == tagId)
            .WhereTopicIsPublic(item => item.Topic);
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
