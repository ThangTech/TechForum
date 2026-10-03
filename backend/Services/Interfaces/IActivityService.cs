using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IActivityService
{
    Task<PagedResultDto<ActivityItemDto>> GetMineAsync(
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}
