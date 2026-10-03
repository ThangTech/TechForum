namespace TechForum.Api.Data.Repositories;

public interface IAdminOverviewRepository
{
    Task<AdminStatisticsData> GetStatisticsAsync(CancellationToken cancellationToken);
    Task<AdminAuditPage> GetAuditPageAsync(int page, int pageSize, CancellationToken cancellationToken);
}
