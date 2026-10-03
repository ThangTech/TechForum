using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/activity")]
public sealed class ActivityController(IActivityService activityService) : ControllerBase
{
    [HttpGet("mine")]
    [ProducesResponseType<PagedResultDto<ActivityItemDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResultDto<ActivityItemDto>>> GetMine(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (page < 1 || pageSize is < 1 or > 50)
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                [page < 1 ? "page" : "pageSize"] =
                    [page < 1 ? "Trang phải lớn hơn hoặc bằng 1." : "Số hoạt động mỗi trang phải từ 1 đến 50."]
            }));
        return Ok(await activityService.GetMineAsync(GetUserId(), page, pageSize, cancellationToken));
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("Phiên đăng nhập thiếu định danh tài khoản.");
}
