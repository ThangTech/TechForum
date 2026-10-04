using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ISkillCommunityService
{
    Task<SkillCommunityDto?> GetAsync(
        int tagId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}
