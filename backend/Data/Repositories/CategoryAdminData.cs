using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record CategoryAdminData(Category Category, int TopicCount);
