using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public sealed class SkillCommunityService : ISkillCommunityService
{
    private readonly ISkillCommunityRepository repository;

    public SkillCommunityService(ISkillCommunityRepository repository)
    {
        this.repository = repository;
    }

    public async Task<SkillCommunityDto?> GetAsync(
        Guid tagId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var data = await repository.GetAsync(tagId, page, pageSize, cancellationToken);
        if (data is null)
        {
            return null;
        }
        return new SkillCommunityDto(
            new TagDto(data.Tag.Id, data.Tag.Name, data.Tag.Slug, data.Tag.Description),
            data.TopicCount,
            data.MemberCount,
            data.Members.Select(member => new SkillMemberDto(
                member.Id, member.DisplayName, member.TopicCount)).ToList(),
            page,
            pageSize,
            data.MemberCount == 0 ? 0 : (int)Math.Ceiling(data.MemberCount / (double)pageSize));
    }
}
