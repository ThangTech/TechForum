using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Services;
using TechForum.Api.Constants;

namespace TechForum.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/reports")]
public sealed class ReportsController : ControllerBase
{
    private readonly IContentReportService reportService;

    public ReportsController(IContentReportService reportService)
    {
        this.reportService = reportService;
    }

    [HttpPost]
    public async Task<ActionResult<ReportReceiptDto>> Create([FromBody] CreateReportRequest request, CancellationToken cancellationToken)
    {
        var result = await reportService.CreateAsync(User.GetRequiredUserId(), request, cancellationToken);
        return this.ToActionResult(result, StatusCodes.Status201Created);
    }

    [HttpGet("admin")]
    [Authorize(Roles = RoleNames.Administrator)]
    public async Task<ActionResult<PagedResultDto<AdminReportDto>>> GetAdminPage([FromQuery] AdminReportQuery query, CancellationToken cancellationToken)
    {
        return Ok(await reportService.GetAdminPageAsync(query.Status, query.Page, query.PageSize, cancellationToken));
    }

    [HttpGet("mine")]
    public async Task<ActionResult<PagedResultDto<MyReportDto>>> GetMine([FromQuery] MyReportQuery query, CancellationToken cancellationToken)
    {
        return Ok(await reportService.GetMineAsync(User.GetRequiredUserId(), query.Status, query.Page, query.PageSize, cancellationToken));
    }

    [HttpPut("admin/{reportId:guid}/resolution")]
    [Authorize(Roles = RoleNames.Administrator)]
    public async Task<ActionResult<AdminReportDto>> Resolve(Guid reportId, [FromBody] ResolveReportRequest request, CancellationToken cancellationToken)
    {
        var result = await reportService.ResolveAsync(reportId, User.GetRequiredUserId(), request, cancellationToken);
        return this.ToActionResult(result);
    }
}
