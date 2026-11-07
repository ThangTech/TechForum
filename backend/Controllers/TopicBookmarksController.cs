using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/topics/{topicId:int}/bookmark")]
public sealed class TopicBookmarksController(ITopicBookmarkService bookmarkService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<BookmarkStatusDto>> Get(int topicId, CancellationToken cancellationToken)
    {
        var result = await bookmarkService.GetStatusAsync(topicId, User.GetUserIdOrNull(), cancellationToken);
        return result is null ? TopicNotFound() : Ok(result);
    }

    [Authorize]
    [HttpPut]
    public async Task<ActionResult<BookmarkStatusDto>> Add(int topicId, CancellationToken cancellationToken)
    {
        var result = await bookmarkService.AddAsync(topicId, User.GetRequiredUserId(), cancellationToken);
        return result is null ? TopicNotFound() : Ok(result);
    }

    [Authorize]
    [HttpDelete]
    public async Task<ActionResult<BookmarkStatusDto>> Remove(int topicId, CancellationToken cancellationToken)
    {
        var result = await bookmarkService.RemoveAsync(topicId, User.GetRequiredUserId(), cancellationToken);
        return result is null ? TopicNotFound() : Ok(result);
    }

    private NotFoundObjectResult TopicNotFound() => NotFound(new ProblemDetails
    {
        Status = StatusCodes.Status404NotFound,
        Title = "Không tìm thấy chủ đề",
        Detail = "Chủ đề không tồn tại hoặc không còn công khai."
    });
}
