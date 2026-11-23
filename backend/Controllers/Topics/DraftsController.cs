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
public sealed class DraftsController : ControllerBase
{
    private readonly IDraftService draftService;

    public DraftsController(IDraftService draftService)
    {
        this.draftService = draftService;
    }

    // The draft for a new topic (no topicId) or for the topic that is being edited. 204 when there is none.
    [HttpGet]
    public async Task<ActionResult<DraftDto>> Get([FromQuery] Guid? topicId, CancellationToken cancellationToken)
    {
        var draft = await draftService.GetAsync(User.GetRequiredUserId(), topicId, cancellationToken);
        return draft is null ? NoContent() : Ok(draft);
    }

    // Saves the draft: it is created the first time and replaced after that.
    [HttpPost]
    public async Task<ActionResult<DraftDto>> Save([FromBody] SaveDraftRequest request, CancellationToken cancellationToken)
    {
        var result = await draftService.SaveAsync(User.GetRequiredUserId(), request, cancellationToken);
        return this.ToActionResult(result);
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromQuery] Guid? topicId, CancellationToken cancellationToken)
    {
        await draftService.DeleteAsync(User.GetRequiredUserId(), topicId, cancellationToken);
        return NoContent();
    }
}
