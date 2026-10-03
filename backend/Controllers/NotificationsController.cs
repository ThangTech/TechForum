using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/notifications")]
public sealed class NotificationsController(INotificationService notificationService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<NotificationPageDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<NotificationPageDto>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        if (page < 1 || pageSize is < 1 or > 50)
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                [page < 1 ? "page" : "pageSize"] =
                    [page < 1 ? "Trang phải lớn hơn hoặc bằng 1." : "Số thông báo mỗi trang phải từ 1 đến 50."]
            })
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Phân trang thông báo chưa hợp lệ"
            });
        }

        return Ok(await notificationService.GetPageAsync(
            GetUserId(), page, pageSize, cancellationToken));
    }

    [HttpPut("{id:long}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkRead(long id, CancellationToken cancellationToken)
    {
        var updated = await notificationService.MarkReadAsync(id, GetUserId(), cancellationToken);
        return updated ? NoContent() : NotFound(new ProblemDetails
        {
            Status = StatusCodes.Status404NotFound,
            Title = "Không tìm thấy thông báo chưa đọc"
        });
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("Phiên đăng nhập thiếu định danh tài khoản.");
}
