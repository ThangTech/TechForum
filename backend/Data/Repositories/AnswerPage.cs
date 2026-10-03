using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record AnswerPage(IReadOnlyList<Answer> Items, int TotalItems);
