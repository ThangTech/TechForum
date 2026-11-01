using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IPublicStatisticsService
{
    Task<PublicStatisticsDto> GetAsync(CancellationToken cancellationToken);
}
