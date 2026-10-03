using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record PublicProfileData(
    ApplicationUser User,
    int PublishedTopicCount,
    IReadOnlyList<Topic> RecentTopics);
