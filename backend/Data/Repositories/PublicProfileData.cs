using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record PublicProfileData(
    ApplicationUser User,
    int PublishedTopicCount,
    int PublicAnswerCount,
    int ReceivedStarCount,
    int FollowerCount,
    int FollowingCount,
    bool IsFollowedByViewer,
    IReadOnlyList<ProfileSkillData> Skills,
    IReadOnlyList<Topic> RecentTopics);

public sealed record ProfileSkillData(int TagId, string Name, string Slug, int TopicCount);
