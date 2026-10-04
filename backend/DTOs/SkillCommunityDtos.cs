namespace TechForum.Api.Dtos;

public sealed record SkillMemberDto(string Id, string DisplayName, int TopicCount);

public sealed record SkillCommunityDto(
    TagDto Tag,
    int TopicCount,
    int MemberCount,
    IReadOnlyList<SkillMemberDto> Members,
    int Page,
    int PageSize,
    int TotalPages);
