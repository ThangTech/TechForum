using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Filters;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[ProfanityFilter]
[Route("api/topics/{topicId:guid}/answers")]
public sealed class AnswersController : ControllerBase
{
    private readonly IAnswerService answerService;
    private readonly IVoteService voteService;

    public AnswersController(IAnswerService answerService, IVoteService voteService)
    {
        this.answerService = answerService;
        this.voteService = voteService;
    }

    // Upvote (1), downvote (-1) or take the vote back (0). The score and the reputation of the author change with it.
    [Authorize]
    [HttpPut("{answerId:guid}/vote")]
    public async Task<ActionResult<VoteDto>> SetVote(Guid topicId, Guid answerId, [FromBody] SetVoteRequest request, CancellationToken cancellationToken)
    {
        var result = await voteService.SetAnswerVoteAsync(topicId, answerId, User.GetRequiredUserId(), request.Value, cancellationToken);
        return this.ToActionResult(result);
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<AnswerDto>>> GetAll(
        Guid topicId,
        [FromQuery] AnswerQuery query,
        CancellationToken cancellationToken)
    {
        var viewerId = User.Identity?.IsAuthenticated == true
            ? User.GetUserIdOrNull()
            : null;
        var page = await answerService.GetPublicPageAsync(topicId, query, cancellationToken, viewerId);
        if (page is not null)
        {
            return Ok(page);
        }
        if (!query.AroundAnswerId.HasValue)
        {
            return NotFound(CreateTopicNotFoundProblem());
        }

        return NotFound(new ProblemDetails
        {
            Status = StatusCodes.Status404NotFound,
            Title = "Không tìm thấy câu trả lời",
            Detail = "Chủ đề hoặc câu trả lời trong liên kết không tồn tại hoặc không còn công khai."
        });
    }

    [Authorize]
    [HttpPut("{answerId:guid}/helpful")]
    public async Task<ActionResult<AnswerHelpfulDto>> AddHelpful(Guid topicId, Guid answerId, CancellationToken cancellationToken)
    {
        var result = await answerService.SetHelpfulAsync(topicId, answerId, User.GetRequiredUserId(), true, cancellationToken);
        return this.ToActionResult(result);
    }

    [Authorize]
    [HttpDelete("{answerId:guid}/helpful")]
    public async Task<ActionResult<AnswerHelpfulDto>> RemoveHelpful(Guid topicId, Guid answerId, CancellationToken cancellationToken)
    {
        var result = await answerService.SetHelpfulAsync(topicId, answerId, User.GetRequiredUserId(), false, cancellationToken);
        return this.ToActionResult(result);
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<AnswerDto>> Create(Guid topicId, [FromBody] CreateAnswerRequest request, CancellationToken cancellationToken)
    {
        var result = await answerService.CreateAsync(topicId, User.GetRequiredUserId(), request, cancellationToken);
        return this.ToActionResult(result, StatusCodes.Status201Created);
    }

    [Authorize]
    [HttpPut("{answerId:guid}/accepted")]
    public async Task<ActionResult<AnswerDto>> Accept(Guid topicId, Guid answerId, CancellationToken cancellationToken)
    {
        var result = await answerService.AcceptAsync(topicId, answerId, User.GetRequiredUserId(), cancellationToken);
        return this.ToActionResult(result);
    }

    [Authorize]
    [HttpPut("{answerId:guid}")]
    public async Task<ActionResult<AnswerDto>> Update(Guid topicId, Guid answerId, [FromBody] CreateAnswerRequest request, CancellationToken cancellationToken)
    {
        var result = await answerService.UpdateAsync(topicId, answerId, User.GetRequiredUserId(), request, cancellationToken);
        return this.ToActionResult(result);
    }

    [Authorize]
    [HttpDelete("{answerId:guid}")]
    public async Task<IActionResult> Delete(Guid topicId, Guid answerId, CancellationToken cancellationToken)
    {
        var result = await answerService.DeleteAsync(topicId, answerId, User.GetRequiredUserId(), cancellationToken);
        return this.ToActionResult(result);
    }

    private static ProblemDetails CreateTopicNotFoundProblem()
    {
        return new()
        {
            Status = StatusCodes.Status404NotFound,
            Title = "Không tìm thấy chủ đề",
            Detail = "Chủ đề không tồn tại hoặc không còn công khai."
        };
    }
}
