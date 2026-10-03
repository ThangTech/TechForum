using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record AdminAccountData(
    ApplicationUser User,
    bool IsAdministrator);

public sealed record AdminAccountPage(
    IReadOnlyList<AdminAccountData> Items,
    int TotalItems);
