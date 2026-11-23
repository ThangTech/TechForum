using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

// Không gắn [ProfanityFilter]: thuộc tính đó sẽ làm sạch yêu cầu trước, và câu trả lời không bao giờ thấy thay đổi.
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
        CancellationToken cancellationToken)
    {
        return Ok(await contentCheckService.CheckAsync(request, cancellationToken));
    }
}
