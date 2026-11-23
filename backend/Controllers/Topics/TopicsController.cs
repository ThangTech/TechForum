using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Extensions;
using TechForum.Api.Filters;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[ProfanityFilter]
[Route("api/topics")]
public sealed class TopicsController : ControllerBase
{
    private readonly ITopicService topicService;

    public TopicsController(ITopicService topicService)
    {
        this.topicService = topicService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<TopicSummaryDto>>> GetAll(
        [FromQuery] TopicQuery query,
        CancellationToken cancellationToken)
    {
        return Ok(await topicService.GetPublicPageAsync(query, cancellationToken));
    }

    [Authorize]
    [HttpGet("following")]
    public async Task<ActionResult<PagedResultDto<TopicSummaryDto>>> GetFollowing(
        [FromQuery] TopicQuery query,
        CancellationToken cancellationToken)
    {
        var followerId = User.GetUserIdOrNull();
        if (string.IsNullOrWhiteSpace(followerId))
        {
            return Unauthorized();
        }

        return Ok(await topicService.GetFollowingPageAsync(followerId, query, cancellationToken));
    }

    [Authorize]
    [HttpGet("mine")]
    public async Task<ActionResult<PagedResultDto<OwnTopicSummaryDto>>> GetMine(
        [FromQuery] TopicQuery query,
        CancellationToken cancellationToken)
    {
        var authorId = User.GetUserIdOrNull();
        if (string.IsNullOrWhiteSpace(authorId))
        {
            return Unauthorized();
        }

        return Ok(await topicService.GetOwnedPageAsync(authorId, query, cancellationToken));
    }

    [Authorize]
    [HttpGet("mine/{id:guid}")]
    public async Task<ActionResult<OwnTopicDto>> GetMineById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var topic = await topicService.GetOwnedByIdAsync(id, User.GetRequiredUserId(), cancellationToken);
        return topic is null
            ? NotFound(CreateNotFoundProblem())
            : Ok(topic);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TopicDetailDto>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var topic = await topicService.GetPublicByIdAsync(id, cancellationToken);
        if (topic is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy nội dung",
                Detail = $"Không có nội dung công khai với mã {id}."
            });
        }

        return Ok(topic);
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<OwnTopicDto>> Create([FromBody] CreateTopicRequest request, CancellationToken cancellationToken)
    {
        var result = await topicService.CreateAsync(User.GetRequiredUserId(), request, cancellationToken);
        return this.ToActionResult(result, StatusCodes.Status201Created);
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<OwnTopicDto>> Update(Guid id, [FromBody] UpdateTopicRequest request, CancellationToken cancellationToken)
    {
        var result = await topicService.UpdateAsync(id, User.GetRequiredUserId(), request, cancellationToken);
        return this.ToActionResult(result);
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await topicService.SoftDeleteAsync(id, User.GetRequiredUserId(), cancellationToken);
        return this.ToActionResult(result);
    }

    private static ProblemDetails CreateNotFoundProblem() => new()
    {
        Status = StatusCodes.Status404NotFound,
        Title = "Không tìm thấy nội dung",
        Detail = "Nội dung không tồn tại hoặc không thuộc tài khoản này."
    };
}
