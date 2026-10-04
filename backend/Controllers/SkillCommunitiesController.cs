using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/tags/{tagId:int}/community")]
public sealed class SkillCommunitiesController(ISkillCommunityService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<SkillCommunityDto>> Get(
        int tagId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (page < 1 || pageSize is < 1 or > 50)
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                [page < 1 ? "page" : "pageSize"] =
                    [page < 1 ? "Trang phải lớn hơn hoặc bằng 1." : "Số thành viên mỗi trang phải từ 1 đến 50."]
            }));
        var result = await service.GetAsync(tagId, page, pageSize, cancellationToken);
        return result is null
            ? NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy kỹ năng" })
            : Ok(result);
    }
}
