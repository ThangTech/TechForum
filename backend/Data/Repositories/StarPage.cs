using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record StarPage(IReadOnlyList<TopicStar> Items, int TotalItems);
