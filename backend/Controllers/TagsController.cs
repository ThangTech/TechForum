using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/tags")]
public sealed class TagsController(ITagService tagService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<TagDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TagDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await tagService.GetActiveAsync(cancellationToken));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType<TagDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TagDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var tag = await tagService.GetActiveByIdAsync(id, cancellationToken);
        if (tag is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy thẻ",
                Detail = $"Không có thẻ đang hoạt động với mã {id}."
            });
        }

        return Ok(tag);
    }
}
