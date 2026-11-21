using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public sealed class ActivityService(IActivityRepository activityRepository) : IActivityService
{
    public async Task<PagedResultDto<ActivityItemDto>> GetMineAsync(
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var result = await activityRepository.GetPublicActivityAsync(userId, page, pageSize, cancellationToken);
        return new PagedResultDto<ActivityItemDto>(
            result.Items.Select(item => new ActivityItemDto(
                item.Type, item.Title, item.Description, item.Link, item.OccurredAtUtc)).ToList(),
            page,
            pageSize,
            result.TotalItems,
            result.TotalItems == 0 ? 0 : (int)Math.Ceiling(result.TotalItems / (double)pageSize));
    }
}
