using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/bookmarks")]
public sealed class BookmarksController(ITopicBookmarkService bookmarkService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResultDto<SavedTopicDto>>> GetMine(
        [FromQuery] BookmarkQuery query,
        CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>();
        if (query.Page < 1) errors["page"] = ["Trang phải lớn hơn hoặc bằng 1."];
        if (query.PageSize is < 1 or > 50) errors["pageSize"] = ["Số phần tử mỗi trang phải từ 1 đến 50."];
        if (errors.Count > 0) return BadRequest(new ValidationProblemDetails(errors));

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Phiên đăng nhập thiếu định danh tài khoản.");
        return Ok(await bookmarkService.GetSavedPageAsync(userId, query, cancellationToken));
    }
}
