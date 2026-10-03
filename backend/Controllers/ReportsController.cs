using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

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
}
