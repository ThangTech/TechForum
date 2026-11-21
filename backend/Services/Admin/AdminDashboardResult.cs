using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public sealed record AdminDashboardResult(
    AdminDashboardDto? Dashboard,
    IReadOnlyDictionary<string, string[]> Errors)
{
    public static AdminDashboardResult Success(AdminDashboardDto dashboard) =>
        new(dashboard, new Dictionary<string, string[]>());

    public static AdminDashboardResult ValidationError(string field, string message) =>
        new(null, new Dictionary<string, string[]> { [field] = [message] });
}
