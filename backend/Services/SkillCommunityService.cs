using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public sealed class SkillCommunityService(ISkillCommunityRepository repository) : ISkillCommunityService
{
    public async Task<SkillCommunityDto?> GetAsync(
        int tagId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var data = await repository.GetAsync(tagId, page, pageSize, cancellationToken);
        if (data is null) return null;
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
