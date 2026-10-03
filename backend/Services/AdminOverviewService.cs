using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public sealed class AdminOverviewService(IAdminOverviewRepository repository) : IAdminOverviewService
{
    public async Task<AdminStatisticsDto> GetStatisticsAsync(CancellationToken cancellationToken)
    {
        var data = await repository.GetStatisticsAsync(cancellationToken);
        return new AdminStatisticsDto(
            data.AccountCount,
            data.PublishedArticleCount,
            data.PublishedQuestionCount,
            data.VisibleAnswerCount,
            data.PendingReportCount);
    }

    public async Task<PagedResultDto<AdminAuditLogDto>> GetAuditPageAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var data = await repository.GetAuditPageAsync(page, pageSize, cancellationToken);
        return new PagedResultDto<AdminAuditLogDto>(
            data.Items.Select(item => new AdminAuditLogDto(
                item.Id,
                new ReportUserDto(item.Administrator.Id, item.Administrator.DisplayName),
                item.Action,
                item.TargetType,
                item.TargetId,
                item.PreviousValue,
                item.NewValue,
                item.Reason,
                item.CreatedAtUtc)).ToList(),
            page,
            pageSize,
            data.TotalItems,
            (int)Math.Ceiling(data.TotalItems / (double)pageSize));
    }
}
