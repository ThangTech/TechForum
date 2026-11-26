namespace TechForum.Api.Dtos;

public sealed record SkillMemberDto(string Id, string DisplayName, int TopicCount);

// Một ô ở trang Cộng đồng: thẻ, số bài công khai và số thành viên đã đăng bài với thẻ đó.
public sealed record CommunitySummaryDto(TagDto Tag, int TopicCount, int MemberCount);

public sealed record SkillCommunityDto(
    TagDto Tag,
    int TopicCount,
    int MemberCount,
    IReadOnlyList<SkillMemberDto> Members,
    int Page,
    int PageSize,
    int TotalPages);
