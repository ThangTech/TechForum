using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/topics/{topicId:guid}/star")]
public sealed class TopicStarsController : ControllerBase
{
    private readonly ITopicStarService topicStarService;

    public TopicStarsController(ITopicStarService topicStarService)
    {
        this.topicStarService = topicStarService;
    }

    [HttpGet]
    public async Task<ActionResult<TopicStarDto>> Get(
        Guid topicId,
        CancellationToken cancellationToken)
    {
        var status = await topicStarService.GetAsync(
            topicId,
            User.GetUserIdOrNull(),
            cancellationToken);
        return status is null ? NotFoundProblem() : Ok(status);
    }

    [Authorize]
    [HttpPut]
    public async Task<ActionResult<TopicStarDto>> Add(
        Guid topicId,
        CancellationToken cancellationToken)
    {
        var status = await topicStarService.AddAsync(topicId, User.GetRequiredUserId(), cancellationToken);
        return status is null ? NotFoundProblem() : Ok(status);
    }

    [Authorize]
    [HttpDelete]
    public async Task<ActionResult<TopicStarDto>> Remove(
        Guid topicId,
        CancellationToken cancellationToken)
    {
        var status = await topicStarService.RemoveAsync(topicId, User.GetRequiredUserId(), cancellationToken);
        return status is null ? NotFoundProblem() : Ok(status);
    }

    private NotFoundObjectResult NotFoundProblem()
    {
        return NotFound(new ProblemDetails
        {
            Status = StatusCodes.Status404NotFound,
            Title = "Không tìm thấy chủ đề",
            Detail = "Chủ đề không tồn tại hoặc không còn công khai."
        });
    }
}
