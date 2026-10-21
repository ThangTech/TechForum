using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class AdminOverviewService(
    IAdminOverviewRepository repository,
    TimeProvider timeProvider) : IAdminOverviewService
{
    private static readonly TimeSpan VietnamOffset = TimeSpan.FromHours(7);

    public async Task<AdminStatisticsDto> GetStatisticsAsync(CancellationToken cancellationToken)
    {
        var data = await repository.GetStatisticsAsync(cancellationToken);
        return MapStatistics(data);
    }

    public async Task<AdminDashboardResult> GetDashboardAsync(
        DateOnly? startDate,
        DateOnly? endDate,
        CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(timeProvider.GetUtcNow().ToOffset(VietnamOffset).Date);
        var end = endDate ?? today;
        var start = startDate ?? DateOnly.FromDayNumber(Math.Max(0, end.DayNumber - 29));
        if (start == DateOnly.MinValue || end == DateOnly.MaxValue)
            return AdminDashboardResult.ValidationError("startDate", "Khoảng ngày nằm ngoài giới hạn hỗ trợ.");
        if (start > end)
            return AdminDashboardResult.ValidationError("startDate", "Ngày bắt đầu không được sau ngày kết thúc.");
        if (end.DayNumber - start.DayNumber + 1 > 366)
            return AdminDashboardResult.ValidationError("endDate", "Chỉ thống kê tối đa 366 ngày trong một lần.");

        var data = await repository.GetDashboardAsync(
            StartOfVietnamDay(start), StartOfVietnamDay(end.AddDays(1)), cancellationToken);
        var dailyCounts = data.Activity
            .GroupBy(point => DateOnly.FromDateTime(point.Date))
            .ToDictionary(group => group.Key, group => new AdminActivityPointDto(
                group.Key, group.Sum(point => point.NewMemberCount), group.Sum(point => point.ArticleCount),
                group.Sum(point => point.QuestionCount), group.Sum(point => point.AnswerCount)));
        var activity = new List<AdminActivityPointDto>();
        for (var date = start; date <= end; date = date.AddDays(1))
            activity.Add(dailyCounts.GetValueOrDefault(date) ?? new AdminActivityPointDto(date, 0, 0, 0, 0));

        var period = new AdminPeriodDto(
            activity.Sum(point => point.NewMemberCount), activity.Sum(point => point.ArticleCount),
            activity.Sum(point => point.QuestionCount), activity.Sum(point => point.AnswerCount));
        var questions = data.Questions;
        return AdminDashboardResult.Success(new AdminDashboardDto(
            start, end, "Asia/Ho_Chi_Minh", MapStatistics(data.Totals), period, activity,
            data.Categories.Select(category => new AdminCategoryActivityDto(
                category.CategoryId, category.CategoryName, category.ArticleCount, category.QuestionCount,
                category.ArticleCount + category.QuestionCount)).ToList(),
            new AdminQuestionStatisticsDto(
                questions.TotalCount, questions.UnansweredCount, questions.UnsolvedCount, questions.SolvedCount),
            new AdminPendingReportsDto(data.Totals.PendingReportCount,
                data.OldestPendingReports.Select(MapPendingReport).ToList()),
            data.RecentAuditLogs.Select(MapAuditLog).ToList()));
    }

    public async Task<PagedResultDto<AdminAuditLogDto>> GetAuditPageAsync(
        AdminAuditQuery query,
        CancellationToken cancellationToken)
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 50);
        var filter = new AdminAuditFilter(
            query.Keyword?.Trim(), query.AdministratorId?.Trim(), query.Action?.Trim(),
            query.From.HasValue ? StartOfVietnamDay(query.From.Value) : null,
            query.To.HasValue ? StartOfVietnamDay(query.To.Value.AddDays(1)) : null);
        var data = await repository.GetAuditPageAsync(page, pageSize, filter, cancellationToken);
        return new PagedResultDto<AdminAuditLogDto>(
            data.Items.Select(MapAuditLog).ToList(),
            page,
            pageSize,
            data.TotalItems,
            (int)Math.Ceiling(data.TotalItems / (double)pageSize));
    }

    private static DateTimeOffset StartOfVietnamDay(DateOnly date) =>
        new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue), VietnamOffset).ToUniversalTime();

    private static AdminStatisticsDto MapStatistics(AdminStatisticsData data) => new(
        data.AccountCount, data.PublishedArticleCount, data.PublishedQuestionCount,
        data.VisibleAnswerCount, data.PendingReportCount);

    private static AdminAuditLogDto MapAuditLog(AdminAuditLog item) => new(
        item.Id, new ReportUserDto(item.Administrator.Id, item.Administrator.DisplayName),
        item.Action, item.TargetType, item.TargetId, item.PreviousValue, item.NewValue, item.Reason, item.CreatedAtUtc);

    private static AdminPendingReportDto MapPendingReport(ContentReport report)
    {
        var topic = report.Topic ?? report.Answer?.Topic;
        var isPublic = topic is { Status: TopicStatus.Published, PublishedAtUtc: not null,
            IsDeleted: false, IsHiddenByModerator: false };
        if (report.Answer is { IsDeleted: true } or { IsHiddenByModerator: true })
            isPublic = false;
        // Dashboard chỉ đưa nhan đề còn công khai; xem nội dung vi phạm ở màn hình báo cáo riêng.
        var title = isPublic ? topic!.Title : "Nội dung không còn công khai";
        return new AdminPendingReportDto(
            report.Id, report.TopicId.HasValue ? "topic" : "answer", report.TopicId ?? report.AnswerId ?? 0,
            title, report.Reason, new ReportUserDto(report.Reporter.Id, report.Reporter.DisplayName), report.CreatedAtUtc);
    }
}
