using TechForum.Api.Models;
using TechForum.Api.Dtos;

namespace TechForum.Api.Data.Repositories;

public sealed record TopicPage(
    IReadOnlyList<Topic> Items,
    int TotalItems,
    IReadOnlyDictionary<Guid, TopicDiscussionDto>? Discussions = null);
