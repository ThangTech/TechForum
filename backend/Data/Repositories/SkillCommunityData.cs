using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record SkillMemberData(string Id, string DisplayName, int TopicCount);

public sealed record SkillCommunityData(
    Tag Tag,
    int TopicCount,
    int MemberCount,
    IReadOnlyList<SkillMemberData> Members);
