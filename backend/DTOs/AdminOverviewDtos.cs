using System.ComponentModel.DataAnnotations;

namespace TechForum.Api.Dtos;

public sealed record AdminStatisticsDto(
    int AccountCount,
    int PublishedArticleCount,
    int PublishedQuestionCount,
    int VisibleAnswerCount,
    int PendingReportCount);

public sealed record AdminDashboardDto(
    DateOnly StartDate,
    DateOnly EndDate,
    string TimeZone,
    AdminStatisticsDto Totals,
    AdminPeriodDto Period,
    IReadOnlyList<AdminActivityPointDto> ActivitySeries,
    IReadOnlyList<AdminCategoryActivityDto> Categories,
    AdminQuestionStatisticsDto Questions,
    AdminPendingReportsDto PendingReports,
    IReadOnlyList<AdminAuditLogDto> RecentAuditLogs);

public sealed record AdminPeriodDto(int NewMemberCount, int ArticleCount, int QuestionCount, int AnswerCount);

public sealed record AdminActivityPointDto(
    DateOnly Date, int NewMemberCount, int ArticleCount, int QuestionCount, int AnswerCount);

public sealed record AdminCategoryActivityDto(
    int CategoryId, string CategoryName, int ArticleCount, int QuestionCount, int TopicCount);

public sealed record AdminQuestionStatisticsDto(
    int TotalCount, int UnansweredCount, int UnsolvedCount, int SolvedCount);

public sealed record AdminPendingReportsDto(int Count, IReadOnlyList<AdminPendingReportDto> Oldest);

public sealed record AdminPendingReportDto(
    int Id,
    string TargetType,
    int TargetId,
    string TargetTitle,
    string Reason,
    ReportUserDto Reporter,
    DateTimeOffset CreatedAtUtc);

public sealed class AdminAuditQuery : IValidatableObject
{
    [Range(1, int.MaxValue)]
    public int Page { get; init; } = 1;

    [Range(1, 50)]
    public int PageSize { get; init; } = 20;

    [StringLength(200)]
    public string? Keyword { get; init; }

    [StringLength(450)]
    public string? AdministratorId { get; init; }

    [StringLength(100)]
    public string? Action { get; init; }

    public DateOnly? From { get; init; }
    public DateOnly? To { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (From > To)
            yield return new ValidationResult("Ngày bắt đầu không được sau ngày kết thúc.", ["from"]);
        if (From == DateOnly.MinValue || To == DateOnly.MaxValue)
            yield return new ValidationResult("Khoảng ngày nằm ngoài giới hạn hỗ trợ.", ["from", "to"]);
    }
}

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
