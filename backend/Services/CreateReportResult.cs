using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public enum CreateReportFailure { None, Validation, TargetNotFound, Duplicate }

public sealed record CreateReportResult(
    ReportReceiptDto? Report,
    CreateReportFailure Failure,
    string? Field,
    string? Message)
{
    public static CreateReportResult Success(ReportReceiptDto report) => new(report, CreateReportFailure.None, null, null);
    public static CreateReportResult Failed(CreateReportFailure failure, string message, string? field = null) =>
        new(null, failure, field, message);
}
