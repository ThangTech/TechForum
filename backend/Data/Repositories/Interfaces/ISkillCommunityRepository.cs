namespace TechForum.Api.Data.Repositories;

public interface ISkillCommunityRepository
{
    Task<SkillCommunityData?> GetAsync(
        Guid tagId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}
