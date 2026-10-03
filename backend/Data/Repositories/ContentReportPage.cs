using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record ContentReportPage(
    IReadOnlyList<ContentReport> Items,
    int TotalItems);
