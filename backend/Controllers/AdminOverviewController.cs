using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Constants;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Administrator)]
[Route("api/admin")]
public sealed class AdminOverviewController(IAdminOverviewService overviewService) : ControllerBase
{
    [HttpGet("statistics")]
    public async Task<ActionResult<AdminStatisticsDto>> GetStatistics(CancellationToken cancellationToken) =>
        Ok(await overviewService.GetStatisticsAsync(cancellationToken));

    [HttpGet("audit-logs")]
    public async Task<ActionResult<PagedResultDto<AdminAuditLogDto>>> GetAuditLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await overviewService.GetAuditPageAsync(page, pageSize, cancellationToken));
}
