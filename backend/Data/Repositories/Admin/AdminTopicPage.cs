using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed record AdminTopicPage(
    IReadOnlyList<Topic> Items,
    int TotalItems,
    // Số báo cáo đang chờ theo mã bài.
    IReadOnlyDictionary<Guid, int>? PendingReports = null);
