using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public enum ResolveReportFailure
{
    None,
    Validation,
    NotFound,
    AlreadyResolved
}

public sealed record ResolveReportResult(
    AdminReportDto? Report,
    ResolveReportFailure Failure,
    string? Field,
    string? Message)
{
    public static ResolveReportResult Success(AdminReportDto report) =>
        new(report, ResolveReportFailure.None, null, null);

    public static ResolveReportResult Failed(
        ResolveReportFailure failure,
        string message,
        string? field = null) => new(null, failure, field, message);
}
