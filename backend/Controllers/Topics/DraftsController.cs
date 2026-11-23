using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

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

    // Bản nháp của bài mới (không có topicId) hoặc của bài đang sửa; 204 khi chưa có.
    [HttpGet]
    public async Task<ActionResult<DraftDto>> Get([FromQuery] Guid? topicId, CancellationToken cancellationToken)
    {
        var draft = await draftService.GetAsync(User.GetRequiredUserId(), topicId, cancellationToken);
        return draft is null ? NoContent() : Ok(draft);
    }

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
