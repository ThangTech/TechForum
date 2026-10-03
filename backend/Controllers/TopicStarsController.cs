using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/topics/{topicId:int}/star")]
public sealed class TopicStarsController(ITopicStarService topicStarService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<TopicStarDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TopicStarDto>> Get(
        int topicId,
        CancellationToken cancellationToken)
    {
        var status = await topicStarService.GetAsync(
            topicId,
            User.FindFirstValue(ClaimTypes.NameIdentifier),
            cancellationToken);
        return status is null ? NotFoundProblem() : Ok(status);
    }

    [Authorize]
    [HttpPut]
    [ProducesResponseType<TopicStarDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TopicStarDto>> Add(
        int topicId,
        CancellationToken cancellationToken)
    {
        var status = await topicStarService.AddAsync(topicId, GetUserId(), cancellationToken);
        return status is null ? NotFoundProblem() : Ok(status);
    }

    [Authorize]
    [HttpDelete]
    [ProducesResponseType<TopicStarDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TopicStarDto>> Remove(
        int topicId,
        CancellationToken cancellationToken)
    {
        var status = await topicStarService.RemoveAsync(topicId, GetUserId(), cancellationToken);
        return status is null ? NotFoundProblem() : Ok(status);
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("Phiên đăng nhập thiếu định danh tài khoản.");

    private NotFoundObjectResult NotFoundProblem() => NotFound(new ProblemDetails
    {
        Status = StatusCodes.Status404NotFound,
        Title = "Không tìm thấy chủ đề",
        Detail = "Chủ đề không tồn tại hoặc không còn công khai."
    });
}
