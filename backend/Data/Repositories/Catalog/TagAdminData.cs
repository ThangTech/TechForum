using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record TagAdminData(Tag Tag, int TopicCount);
