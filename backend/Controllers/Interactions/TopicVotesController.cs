using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

// The upvotes and downvotes of a post. The sum is its score; the author earns reputation (see ReputationRules).
[ApiController]
[Route("api/topics/{topicId:guid}/vote")]
public sealed class TopicVotesController : ControllerBase
{
    private readonly IVoteService voteService;

    public TopicVotesController(IVoteService voteService)
    {
        this.voteService = voteService;
    }

    [HttpGet]
    public async Task<ActionResult<VoteDto>> Get(Guid topicId, CancellationToken cancellationToken)
    {
        var vote = await voteService.GetTopicVoteAsync(topicId, User.GetUserIdOrNull(), cancellationToken);
        return vote is null ? NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy nội dung" }) : Ok(vote);
    }

    [Authorize]
    [HttpPut]
    public async Task<ActionResult<VoteDto>> Set(
        Guid topicId,
        [FromBody] SetVoteRequest request,
        CancellationToken cancellationToken)
    {
        return this.ToActionResult(await voteService.SetTopicVoteAsync(topicId, User.GetRequiredUserId(), request.Value, cancellationToken));
    }
}
