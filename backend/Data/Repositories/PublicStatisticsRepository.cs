using Microsoft.EntityFrameworkCore;
using TechForum.Api.Enums;

namespace TechForum.Api.Data.Repositories;

public sealed class PublicStatisticsRepository(TechForumDbContext dbContext) : IPublicStatisticsRepository
{
    public async Task<PublicStatisticsData> GetAsync(CancellationToken cancellationToken)
    {
        // Chỉ đếm nội dung công khai, cùng điều kiện với thống kê quản trị.
        var publicTopics = dbContext.Topics.AsNoTracking().Where(topic =>
            topic.Status == TopicStatus.Published && topic.PublishedAtUtc != null &&
            !topic.IsDeleted && !topic.IsHiddenByModerator);

        var memberCount = await dbContext.Users.CountAsync(cancellationToken);
        var articleCount = await publicTopics.CountAsync(topic => topic.Type == TopicType.Article, cancellationToken);
        var questionCount = await publicTopics.CountAsync(topic => topic.Type == TopicType.Question, cancellationToken);
        return new PublicStatisticsData(memberCount, articleCount, questionCount);
    }
}
