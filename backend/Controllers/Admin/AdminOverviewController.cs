using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Constants;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Administrator)]
[Route("api/admin")]
public sealed class AdminOverviewController : ControllerBase
{
    private readonly IAdminOverviewService overviewService;

    public AdminOverviewController(IAdminOverviewService overviewService)
    {
        this.overviewService = overviewService;
    }

    [HttpGet("statistics")]
    public async Task<ActionResult<AdminStatisticsDto>> GetStatistics(CancellationToken cancellationToken) =>
        Ok(await overviewService.GetStatisticsAsync(cancellationToken));

    [HttpGet("dashboard")]
    public async Task<ActionResult<AdminDashboardDto>> GetDashboard([FromQuery] DateOnly? startDate, [FromQuery] DateOnly? endDate, CancellationToken cancellationToken)
    {
        var result = await overviewService.GetDashboardAsync(startDate, endDate, cancellationToken);
        return this.ToActionResult(result);
    }

    [HttpGet("audit-logs")]
    public async Task<ActionResult<PagedResultDto<AdminAuditLogDto>>> GetAuditLogs(
        [FromQuery] AdminAuditQuery query,
        CancellationToken cancellationToken = default) =>
        Ok(await overviewService.GetAuditPageAsync(query, cancellationToken));
}
