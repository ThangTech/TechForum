using Microsoft.EntityFrameworkCore;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class AdminOverviewRepository(TechForumDbContext dbContext) : IAdminOverviewRepository
{
    public async Task<AdminStatisticsData> GetStatisticsAsync(CancellationToken cancellationToken)
    {
        var accountCount = await dbContext.Users.CountAsync(cancellationToken);
        var articleCount = await PublicTopics().CountAsync(topic => topic.Type == TopicType.Article,
            cancellationToken);
        var questionCount = await PublicTopics().CountAsync(topic => topic.Type == TopicType.Question,
            cancellationToken);
        var answerCount = await PublicAnswers().CountAsync(cancellationToken);
        var reportCount = await dbContext.ContentReports.CountAsync(report => report.Status == ReportStatus.Pending, cancellationToken);
        return new AdminStatisticsData(
            accountCount,
            articleCount,
            questionCount,
            answerCount,
            reportCount);
    }

    public async Task<AdminDashboardData> GetDashboardAsync(
        DateTimeOffset startUtc,
        DateTimeOffset endUtcExclusive,
        CancellationToken cancellationToken)
    {
        var totals = await GetStatisticsAsync(cancellationToken);
        var topics = PublicTopics().Where(topic =>
            topic.PublishedAtUtc >= startUtc && topic.PublishedAtUtc < endUtcExclusive);

        // Nhóm tại SQL theo ngày Việt Nam; chỉ tải các tổng ngày, không tải toàn bộ nội dung.
        var topicDays = await topics
            .GroupBy(topic => topic.PublishedAtUtc!.Value.AddHours(7).Date)
            .Select(group => new AdminActivityData(
                group.Key, 0,
                group.Count(topic => topic.Type == TopicType.Article),
                group.Count(topic => topic.Type == TopicType.Question), 0))
            .ToListAsync(cancellationToken);
        var memberDays = await dbContext.Users.AsNoTracking()
            .Where(user => user.CreatedAtUtc >= startUtc && user.CreatedAtUtc < endUtcExclusive)
            .GroupBy(user => user.CreatedAtUtc.AddHours(7).Date)
            .Select(group => new AdminActivityData(group.Key, group.Count(), 0, 0, 0))
            .ToListAsync(cancellationToken);
        var answerDays = await PublicAnswers()
            .Where(answer => answer.CreatedAtUtc >= startUtc && answer.CreatedAtUtc < endUtcExclusive)
            .GroupBy(answer => answer.CreatedAtUtc.AddHours(7).Date)
            .Select(group => new AdminActivityData(group.Key, 0, 0, 0, group.Count()))
            .ToListAsync(cancellationToken);
        var activity = topicDays.Concat(memberDays).Concat(answerDays).ToList();

        var categories = await topics
            .GroupBy(topic => new { topic.CategoryId, topic.Category.Name })
            .Select(group => new AdminCategoryActivityData(
                group.Key.CategoryId, group.Key.Name,
                group.Count(topic => topic.Type == TopicType.Article),
                group.Count(topic => topic.Type == TopicType.Question)))
            .ToListAsync(cancellationToken);
        categories = categories
            .OrderByDescending(category => category.ArticleCount + category.QuestionCount)
            .ThenBy(category => category.CategoryName)
            .ThenBy(category => category.CategoryId)
            .ToList();

        var questions = topics.Where(topic => topic.Type == TopicType.Question);
        var questionCount = await questions.CountAsync(cancellationToken);
        var unansweredCount = await questions.CountAsync(topic => !topic.Answers.Any(answer =>
            answer.ParentAnswerId == null && !answer.IsDeleted && !answer.IsHiddenByModerator), cancellationToken);
        var solvedCount = await questions.CountAsync(topic => topic.Answers.Any(answer =>
            answer.Id == topic.AcceptedAnswerId && answer.ParentAnswerId == null &&
            !answer.IsDeleted && !answer.IsHiddenByModerator), cancellationToken);
        var questionStatistics = new AdminQuestionStatisticsData(
            questionCount, unansweredCount, questionCount - unansweredCount - solvedCount, solvedCount);

        var reports = await dbContext.ContentReports.AsNoTracking()
            .Where(report => report.Status == ReportStatus.Pending)
            .OrderBy(report => report.CreatedAtUtc)
            .ThenBy(report => report.Id)
            .Take(5)
            .Include(report => report.Reporter)
            .Include(report => report.Topic)
            .Include(report => report.Answer).ThenInclude(answer => answer!.Topic)
            .ToListAsync(cancellationToken);
        var audit = await GetAuditPageAsync(1, 5, new AdminAuditFilter(), cancellationToken);
        return new AdminDashboardData(totals, activity, categories, questionStatistics, reports, audit.Items);
    }

    public async Task<AdminAuditPage> GetAuditPageAsync(
        int page,
        int pageSize,
        AdminAuditFilter filter,
        CancellationToken cancellationToken)
    {
        var query = dbContext.AdminAuditLogs.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(filter.Keyword))
        {
            query = query.Where(item => item.Administrator.DisplayName.Contains(filter.Keyword) ||
                item.Action.Contains(filter.Keyword) || item.TargetType.Contains(filter.Keyword) ||
                item.TargetId.Contains(filter.Keyword) || item.Reason.Contains(filter.Keyword));
        }
        if (!string.IsNullOrWhiteSpace(filter.AdministratorId))
            query = query.Where(item => item.AdministratorId == filter.AdministratorId);
        if (!string.IsNullOrWhiteSpace(filter.Action))
            query = query.Where(item => item.Action == filter.Action);
        if (filter.FromUtc.HasValue)
            query = query.Where(item => item.CreatedAtUtc >= filter.FromUtc.Value);
        if (filter.ToUtcExclusive.HasValue)
            query = query.Where(item => item.CreatedAtUtc < filter.ToUtcExclusive.Value);
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

    private IQueryable<Topic> PublicTopics() => dbContext.Topics.AsNoTracking().Where(topic =>
        topic.Status == TopicStatus.Published && topic.PublishedAtUtc != null &&
        !topic.IsDeleted && !topic.IsHiddenByModerator);

    private IQueryable<Answer> PublicAnswers() => dbContext.Answers.AsNoTracking().Where(answer =>
        !answer.IsDeleted && !answer.IsHiddenByModerator &&
        (answer.ParentAnswerId == null ||
            (answer.ParentAnswer != null && answer.ParentAnswer.TopicId == answer.TopicId &&
             answer.ParentAnswer.ParentAnswerId == null &&
             !answer.ParentAnswer.IsDeleted && !answer.ParentAnswer.IsHiddenByModerator)) &&
        answer.Topic.Status == TopicStatus.Published && answer.Topic.PublishedAtUtc != null &&
        !answer.Topic.IsDeleted && !answer.Topic.IsHiddenByModerator);
}
