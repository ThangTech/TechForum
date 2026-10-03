using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record AdminTopicPage(IReadOnlyList<Topic> Items, int TotalItems);
