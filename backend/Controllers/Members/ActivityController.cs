using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/activity")]
public sealed class ActivityController : ControllerBase
{
    private readonly IActivityService activityService;

    public ActivityController(IActivityService activityService)
    {
        this.activityService = activityService;
    }

    [HttpGet("mine")]
    public async Task<ActionResult<PagedResultDto<ActivityItemDto>>> GetMine([FromQuery] PageQuery query, CancellationToken cancellationToken)
    {
        return Ok(await activityService.GetMineAsync(User.GetRequiredUserId(), query.Page, query.PageSize, cancellationToken));
    }
}
