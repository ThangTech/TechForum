using System.ComponentModel.DataAnnotations;
namespace TechForum.Api.Dtos;

public sealed record CreateReportRequest(
    string? TargetType,
    Guid TargetId,
    string? Reason,
    string? Details);

public sealed record ReportReceiptDto(
    Guid Id,
    string TargetType,
    Guid TargetId,
    string Reason,
    string? Details,
    string Status,
    DateTimeOffset CreatedAtUtc);

public sealed record ResolveReportRequest(
    string? Decision,
    string? ResolutionNote);

public sealed record MyReportDto(
    Guid Id,
    string TargetType,
    Guid TargetId,
    Guid? TopicId,
    string? TargetTitle,
    string Reason,
    string? Details,
    string Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? ResolvedAtUtc,
    string? ResolutionNote);

public sealed record ReportUserDto(
    string Id,
    string DisplayName);

public sealed record AdminReportDto(
    Guid Id,
    string TargetType,
    Guid TargetId,
    string TargetTitle,
    string TargetBodyHtml,
    ReportUserDto Reporter,
    string Reason,
    string? Details,
    string Status,
    DateTimeOffset CreatedAtUtc,
    ReportUserDto? ResolvedBy,
    DateTimeOffset? ResolvedAtUtc,
    string? ResolutionNote,
    Guid TopicId,
    ReportUserDto TargetAuthor,
    bool IsTargetHidden,
    // Hidden by itself because many members reported it; rejecting the reports shows it again.
    bool IsTargetAutoHidden,
    bool IsTargetDeleted,
    string? ParentAnswerBodyHtml);

public sealed class AdminReportQuery : PageQuery
{
    [RegularExpression("(?i)^(pending|accepted|rejected)?$", ErrorMessage = "Trạng thái phải là pending, accepted hoặc rejected.")]
    public string? Status { get; init; } = "pending";
}

public sealed class MyReportQuery : PageQuery
{
    public MyReportQuery()
    {
        PageSize = 10;
    }

    [RegularExpression("(?i)^(pending|accepted|rejected)?$", ErrorMessage = "Trạng thái phải là pending, accepted hoặc rejected.")]
    public string? Status { get; init; }
}
