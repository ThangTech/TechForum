using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IContentReportService
{
    Task<CreateReportResult> CreateAsync(
        string reporterId,
        CreateReportRequest request,
        CancellationToken cancellationToken);
    Task<PagedResultDto<AdminReportDto>?> GetAdminPageAsync(
        string? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
    Task<ResolveReportResult> ResolveAsync(
        int reportId,
        string administratorId,
        ResolveReportRequest request,
        CancellationToken cancellationToken);
}
