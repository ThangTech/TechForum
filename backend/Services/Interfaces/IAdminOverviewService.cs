using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IAdminOverviewService
{
    Task<AdminStatisticsDto> GetStatisticsAsync(CancellationToken cancellationToken);
    Task<AdminDashboardResult> GetDashboardAsync(
        DateOnly? startDate, DateOnly? endDate, CancellationToken cancellationToken);
    Task<PagedResultDto<AdminAuditLogDto>> GetAuditPageAsync(
        AdminAuditQuery query,
        CancellationToken cancellationToken);
}
