using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/notifications")]
public sealed class NotificationsController : ControllerBase
{
    private readonly INotificationService notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        this.notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<NotificationPageDto>> GetAll([FromQuery] NotificationQuery query, CancellationToken cancellationToken)
    {
        return Ok(await notificationService.GetPageAsync(User.GetRequiredUserId(), query.Page, query.PageSize, cancellationToken));
    }

    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken cancellationToken)
    {
        var updated = await notificationService.MarkReadAsync(id, User.GetRequiredUserId(), cancellationToken);
        return updated ? NoContent() : NotFound(new ProblemDetails
        {
            Status = StatusCodes.Status404NotFound,
            Title = "Không tìm thấy thông báo chưa đọc"
        });
    }

}
