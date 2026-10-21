using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record AdminAuditPage(IReadOnlyList<AdminAuditLog> Items, int TotalItems);

public sealed record AdminStatisticsData(
    int AccountCount,
    int PublishedArticleCount,
    int PublishedQuestionCount,
    int VisibleAnswerCount,
    int PendingReportCount);

public sealed record AdminDashboardData(
    AdminStatisticsData Totals,
    IReadOnlyList<AdminActivityData> Activity,
    IReadOnlyList<AdminCategoryActivityData> Categories,
    AdminQuestionStatisticsData Questions,
    IReadOnlyList<ContentReport> OldestPendingReports,
    IReadOnlyList<AdminAuditLog> RecentAuditLogs);

public sealed record AdminActivityData(
    DateTime Date, int NewMemberCount, int ArticleCount, int QuestionCount, int AnswerCount);

public sealed record AdminCategoryActivityData(
    int CategoryId, string CategoryName, int ArticleCount, int QuestionCount);

public sealed record AdminQuestionStatisticsData(
    int TotalCount, int UnansweredCount, int UnsolvedCount, int SolvedCount);

public sealed record AdminAuditFilter(
    string? Keyword = null,
    string? AdministratorId = null,
    string? Action = null,
    DateTimeOffset? FromUtc = null,
    DateTimeOffset? ToUtcExclusive = null);
