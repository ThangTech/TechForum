using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IAdminOverviewService
{
    Task<AdminStatisticsDto> GetStatisticsAsync(CancellationToken cancellationToken);
    Task<PagedResultDto<AdminAuditLogDto>> GetAuditPageAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}
