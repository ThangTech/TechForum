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
