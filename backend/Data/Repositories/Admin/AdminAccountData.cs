using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record AdminAccountData(
    ApplicationUser User,
    bool IsAdministrator,
    int TopicCount,
    int AnswerCount,
    int ViolationCount);

public sealed record AdminAccountFilter(string? Keyword, bool? IsLocked, bool? IsAdministrator, bool UnverifiedOnly);

public sealed record AdminAccountPage(
    IReadOnlyList<AdminAccountData> Items,
    int TotalItems);
