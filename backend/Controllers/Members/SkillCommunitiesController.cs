using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/tags/{tagId:guid}/community")]
public sealed class SkillCommunitiesController : ControllerBase
{
    private readonly ISkillCommunityService service;

    public SkillCommunitiesController(ISkillCommunityService service)
    {
        this.service = service;
    }

    [HttpGet]
    public async Task<ActionResult<SkillCommunityDto>> Get(Guid tagId, [FromQuery] PageQuery query, CancellationToken cancellationToken)
    {
        var result = await service.GetAsync(tagId, query.Page, query.PageSize, cancellationToken);
        if (result is null)
        {
            return NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy kỹ năng" });
        }

        return Ok(result);
    }
}
