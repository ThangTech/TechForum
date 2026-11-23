using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/bookmarks")]
public sealed class BookmarksController : ControllerBase
{
    private readonly ITopicBookmarkService bookmarkService;

    public BookmarksController(ITopicBookmarkService bookmarkService)
    {
        this.bookmarkService = bookmarkService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<SavedTopicDto>>> GetMine(
        [FromQuery] BookmarkQuery query,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredUserId();
        return Ok(await bookmarkService.GetSavedPageAsync(userId, query, cancellationToken));
    }
}
