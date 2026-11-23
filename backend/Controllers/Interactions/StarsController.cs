using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

// The topics that the signed-in member gave a star ("bài đã thả sao"), to read them again.
[ApiController]
[Authorize]
[Route("api/stars")]
public sealed class StarsController : ControllerBase
{
    private readonly ITopicStarService starService;

    public StarsController(ITopicStarService starService)
    {
        this.starService = starService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<SavedTopicDto>>> GetMine(
        [FromQuery] BookmarkQuery query,
        CancellationToken cancellationToken)
    {
        return Ok(await starService.GetStarredPageAsync(User.GetRequiredUserId(), query, cancellationToken));
    }
}
