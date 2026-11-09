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
public sealed class StarsController(ITopicStarService starService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResultDto<SavedTopicDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResultDto<SavedTopicDto>>> GetMine(
        [FromQuery] BookmarkQuery query,
        CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>();
        if (query.Page < 1) errors["page"] = ["Trang phải lớn hơn hoặc bằng 1."];
        if (query.PageSize is < 1 or > 50) errors["pageSize"] = ["Số phần tử mỗi trang phải từ 1 đến 50."];
        if (errors.Count > 0) return BadRequest(new ValidationProblemDetails(errors));

        return Ok(await starService.GetStarredPageAsync(User.GetRequiredUserId(), query, cancellationToken));
    }
}
