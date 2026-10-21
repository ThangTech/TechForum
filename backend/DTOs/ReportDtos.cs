namespace TechForum.Api.Dtos;

public sealed record CreateReportRequest(
    string? TargetType,
    int TargetId,
    string? Reason,
    string? Details);

public sealed record ReportReceiptDto(
    int Id,
    string TargetType,
    int TargetId,
    string Reason,
    string? Details,
    string Status,
    DateTimeOffset CreatedAtUtc);

public sealed record ResolveReportRequest(
    string? Decision,
    string? ResolutionNote);

public sealed record MyReportDto(
    int Id,
    string TargetType,
    int TargetId,
    int? TopicId,
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
    int Id,
    string TargetType,
    int TargetId,
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
    int TopicId,
    ReportUserDto TargetAuthor,
    bool IsTargetHidden,
    bool IsTargetDeleted,
    string? ParentAnswerBodyHtml);
