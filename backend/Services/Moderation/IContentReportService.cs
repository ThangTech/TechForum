using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IContentReportService
{
    Task<Result<ReportReceiptDto>> CreateAsync(
        string reporterId,
        CreateReportRequest request,
        CancellationToken cancellationToken);
    Task<PagedResultDto<AdminReportDto>> GetAdminPageAsync(
        AdminReportQuery query,
        CancellationToken cancellationToken);
    Task<PagedResultDto<MyReportDto>> GetMineAsync(
        string reporterId, string? status, int page, int pageSize, CancellationToken cancellationToken);
    Task<Result<AdminReportDto>> ResolveAsync(
        Guid reportId,
        string administratorId,
        ResolveReportRequest request,
        CancellationToken cancellationToken);
}
