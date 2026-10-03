using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;
using TechForum.Api.Constants;

namespace TechForum.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/reports")]
public sealed class ReportsController(IContentReportService reportService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ReportReceiptDto>> Create(
        [FromBody] CreateReportRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Phiên đăng nhập thiếu định danh tài khoản.");
        var result = await reportService.CreateAsync(userId, request, cancellationToken);
        return result.Failure switch
        {
            CreateReportFailure.None => StatusCode(StatusCodes.Status201Created, result.Report),
            CreateReportFailure.TargetNotFound => NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy nội dung", Detail = result.Message }),
            CreateReportFailure.Duplicate => Conflict(new ProblemDetails { Status = 409, Title = "Báo cáo đang chờ xử lý", Detail = result.Message }),
            CreateReportFailure.Validation => BadRequest(new ValidationProblemDetails(
                new Dictionary<string, string[]> { [result.Field ?? "report"] = [result.Message ?? "Báo cáo chưa hợp lệ."] })),
            _ => throw new InvalidOperationException("Trạng thái tạo báo cáo không được hỗ trợ.")
        };
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

    [HttpPut("admin/{reportId:int}/resolution")]
    [Authorize(Roles = RoleNames.Administrator)]
    public async Task<ActionResult<AdminReportDto>> Resolve(
        int reportId,
        [FromBody] ResolveReportRequest request,
        CancellationToken cancellationToken)
    {
        var administratorId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Phiên quản trị thiếu định danh tài khoản.");
        var result = await reportService.ResolveAsync(reportId, administratorId, request, cancellationToken);
        return result.Failure switch
        {
            ResolveReportFailure.None => Ok(result.Report),
            ResolveReportFailure.NotFound => NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy báo cáo", Detail = result.Message }),
            ResolveReportFailure.AlreadyResolved => Conflict(new ProblemDetails { Status = 409, Title = "Báo cáo đã được xử lý", Detail = result.Message }),
            ResolveReportFailure.Validation => BadRequest(new ValidationProblemDetails(
                new Dictionary<string, string[]> { [result.Field ?? "report"] = [result.Message ?? "Yêu cầu chưa hợp lệ."] })),
            _ => throw new InvalidOperationException("Trạng thái xử lý báo cáo không được hỗ trợ.")
        };
    }
}
