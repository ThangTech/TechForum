using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record PublicProfileData(
    ApplicationUser User,
    int PublishedTopicCount,
    int PublicAnswerCount,
    int ReceivedUpvoteCount,
    int FollowerCount,
    int FollowingCount,
    bool IsFollowedByViewer,
    IReadOnlyList<ProfileSkillData> Skills,
    IReadOnlyList<Topic> RecentTopics);

// IsChosen: thành viên tự chọn; nếu không thì kỹ năng được suy ra từ thẻ trong nội dung công khai của họ.
public sealed record ProfileSkillData(Guid TagId, string Name, string Slug, int TopicCount, bool IsChosen = false);
