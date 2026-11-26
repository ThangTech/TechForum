namespace TechForum.Api.Data.Repositories;

public interface ISkillCommunityRepository
{
    Task<IReadOnlyList<CommunitySummaryData>> GetSummariesAsync(CancellationToken cancellationToken);
    Task<SkillCommunityData?> GetAsync(
        Guid tagId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}

public sealed record CommunitySummaryData(TechForum.Api.Models.Tag Tag, int TopicCount, int MemberCount);
