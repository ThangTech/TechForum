namespace TechForum.Api.Data.Repositories;

public interface IPublicStatisticsRepository
{
    Task<PublicStatisticsData> GetAsync(CancellationToken cancellationToken);
}
