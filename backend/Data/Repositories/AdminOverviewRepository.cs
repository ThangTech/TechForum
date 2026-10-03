using Microsoft.EntityFrameworkCore;
using TechForum.Api.Enums;

namespace TechForum.Api.Data.Repositories;

public sealed class AdminOverviewRepository(TechForumDbContext dbContext) : IAdminOverviewRepository
{
    public async Task<AdminStatisticsData> GetStatisticsAsync(CancellationToken cancellationToken)
    {
        var accountCount = await dbContext.Users.CountAsync(cancellationToken);
        var articleCount = await dbContext.Topics.CountAsync(topic =>
            topic.Type == TopicType.Article && topic.Status == TopicStatus.Published && !topic.IsDeleted,
            cancellationToken);
        var questionCount = await dbContext.Topics.CountAsync(topic =>
            topic.Type == TopicType.Question && topic.Status == TopicStatus.Published && !topic.IsDeleted,
            cancellationToken);
        var answerCount = await dbContext.Answers.CountAsync(answer =>
            !answer.IsDeleted &&
            !answer.IsHiddenByModerator &&
            answer.Topic.Status == TopicStatus.Published &&
            !answer.Topic.IsDeleted &&
            !answer.Topic.IsHiddenByModerator,
            cancellationToken);
        var reportCount = await dbContext.ContentReports.CountAsync(report => report.Status == ReportStatus.Pending, cancellationToken);
        return new AdminStatisticsData(
            accountCount,
            articleCount,
            questionCount,
            answerCount,
            reportCount);
    }

    public async Task<AdminAuditPage> GetAuditPageAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = dbContext.AdminAuditLogs.AsNoTracking();
        var totalItems = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(item => item.CreatedAtUtc)
            .ThenByDescending(item => item.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(item => item.Administrator)
            .ToListAsync(cancellationToken);
        return new AdminAuditPage(items, totalItems);
    }
}
