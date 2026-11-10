using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

// The automatic drafts of the signed-in member. The member id comes from the token, never from the request.
[ApiController]
[Authorize]
[Route("api/drafts")]
public sealed class DraftsController(IDraftService draftService) : ControllerBase
{
    // The draft for a new topic (no topicId) or for the topic that is being edited. 204 when there is none.
    [HttpGet]
    [ProducesResponseType<DraftDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult<DraftDto>> Get([FromQuery] Guid? topicId, CancellationToken cancellationToken)
    {
        var draft = await draftService.GetAsync(User.GetRequiredUserId(), topicId, cancellationToken);
        return draft is null ? NoContent() : Ok(draft);
    }

    // Saves the draft: it is created the first time and replaced after that.
    [HttpPost]
    [ProducesResponseType<DraftDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DraftDto>> Save(
        [FromBody] SaveDraftRequest request,
        CancellationToken cancellationToken)
    {
        var result = await draftService.SaveAsync(User.GetRequiredUserId(), request, cancellationToken);
        return result.Failure switch
        {
            DraftWriteFailure.None => Ok(result.Draft),
            DraftWriteFailure.NotFound => NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy nội dung",
                Detail = result.Message
            }),
            _ => BadRequest(new ValidationProblemDetails(
                new Dictionary<string, string[]> { [result.Field ?? "draft"] = [result.Message ?? "Bản nháp chưa hợp lệ."] })
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Bản nháp chưa hợp lệ"
            })
        };
    }

    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete([FromQuery] Guid? topicId, CancellationToken cancellationToken)
    {
        await draftService.DeleteAsync(User.GetRequiredUserId(), topicId, cancellationToken);
        return NoContent();
    }
}
