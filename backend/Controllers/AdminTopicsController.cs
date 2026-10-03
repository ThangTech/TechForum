using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Constants;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Administrator)]
[Route("api/admin/topics")]
public sealed class AdminTopicsController(IAdminTopicService topicService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResultDto<AdminTopicDto>>> GetPage(
        [FromQuery] AdminTopicQuery query,
        CancellationToken cancellationToken)
    {
        var result = await topicService.GetPageAsync(query, cancellationToken);
        return result is null
            ? BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]> { ["filters"] = ["Bộ lọc nội dung không hợp lệ."] }))
            : Ok(result);
    }

    [HttpPut("{topicId:int}/moderation")]
    public async Task<ActionResult<AdminTopicDto>> Moderate(
        int topicId,
        [FromBody] ModerateTopicRequest request,
        CancellationToken cancellationToken)
    {
        var administratorId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Phiên quản trị thiếu định danh tài khoản.");
        var result = await topicService.ModerateAsync(topicId, administratorId, request, cancellationToken);
        return result.Failure switch
        {
            AdminTopicWriteFailure.None => Ok(result.Topic),
            AdminTopicWriteFailure.NotFound => NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy nội dung", Detail = result.Message }),
            AdminTopicWriteFailure.Conflict => Conflict(new ProblemDetails { Status = 409, Title = "Không thể kiểm duyệt", Detail = result.Message }),
            AdminTopicWriteFailure.Validation => BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]> { [result.Field ?? "moderation"] = [result.Message ?? "Yêu cầu chưa hợp lệ."] })),
            _ => throw new InvalidOperationException("Trạng thái kiểm duyệt không được hỗ trợ.")
        };
    }
}
