using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record AdminAuditPage(IReadOnlyList<AdminAuditLog> Items, int TotalItems);

public sealed record AdminStatisticsData(
    int AccountCount,
    int PublishedArticleCount,
    int PublishedQuestionCount,
    int VisibleAnswerCount,
    int PendingReportCount);
