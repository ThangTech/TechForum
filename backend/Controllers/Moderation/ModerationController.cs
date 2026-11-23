using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

// Checks a text before it is posted. It is not marked with [ProfanityFilter]: that attribute would clean the request
// first and the answer would never show a change.
[ApiController]
[Authorize]
[Route("api/moderation")]
public sealed class ModerationController : ControllerBase
{
    private readonly IContentCheckService contentCheckService;

    public ModerationController(IContentCheckService contentCheckService)
    {
        this.contentCheckService = contentCheckService;
    }

    [HttpPost("check")]
    public async Task<ActionResult<ContentCheckResultDto>> Check(
        [FromBody] CheckContentRequest request,
        CancellationToken cancellationToken) =>
        Ok(await contentCheckService.CheckAsync(request, cancellationToken));
}
