using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record TopicPage(
    IReadOnlyList<Topic> Items,
    int TotalItems);
