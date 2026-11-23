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
    public async Task<ActionResult<PagedResultDto<AdminReportDto>>> GetAdminPage(
        [FromQuery] string? status = "pending",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await reportService.GetAdminPageAsync(status, page, pageSize, cancellationToken);
        return result is null
            ? BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["status"] = ["Trạng thái phải là pending, accepted hoặc rejected."]
            }))
            : Ok(result);
    }

    [HttpGet("mine")]
    public async Task<ActionResult<PagedResultDto<MyReportDto>>> GetMine(
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var userId = User.GetRequiredUserId();
        var result = await reportService.GetMineAsync(userId, status, page, pageSize, cancellationToken);
        return result is null
            ? BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["status"] = ["Trạng thái phải là pending, accepted hoặc rejected."]
            }))
            : Ok(result);
    }

    [HttpPut("admin/{reportId:guid}/resolution")]
    [Authorize(Roles = RoleNames.Administrator)]
    public async Task<ActionResult<AdminReportDto>> Resolve(Guid reportId, [FromBody] ResolveReportRequest request, CancellationToken cancellationToken)
    {
        var result = await reportService.ResolveAsync(reportId, User.GetRequiredUserId(), request, cancellationToken);
        return this.ToActionResult(result);
    }
}
