namespace TechForum.Api.Data.Repositories;

public interface ISkillCommunityRepository
{
    Task<SkillCommunityData?> GetAsync(
        int tagId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}
