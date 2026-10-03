namespace TechForum.Api.Dtos;

public sealed record AdminStatisticsDto(
    int AccountCount,
    int PublishedArticleCount,
    int PublishedQuestionCount,
    int VisibleAnswerCount,
    int PendingReportCount);

public sealed record AdminAuditLogDto(
    long Id,
    ReportUserDto Administrator,
    string Action,
    string TargetType,
    string TargetId,
    string? PreviousValue,
    string? NewValue,
    string Reason,
    DateTimeOffset CreatedAtUtc);
