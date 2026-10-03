using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record BookmarkPage(IReadOnlyList<TopicBookmark> Items, int TotalItems);
