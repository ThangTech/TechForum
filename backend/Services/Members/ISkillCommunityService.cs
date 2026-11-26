using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ISkillCommunityService
{
    Task<IReadOnlyList<CommunitySummaryDto>> GetSummariesAsync(CancellationToken cancellationToken);
    Task<SkillCommunityDto?> GetAsync(
        Guid tagId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}
