using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/communities")]
public sealed class CommunitiesController : ControllerBase
{
    private readonly ISkillCommunityService service;

    public CommunitiesController(ISkillCommunityService service)
    {
        this.service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CommunitySummaryDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await service.GetSummariesAsync(cancellationToken));
    }
}
