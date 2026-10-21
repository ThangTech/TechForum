using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/topics/{topicId:int}/related")]
public sealed class RelatedTopicsController(IRelatedTopicService service) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<RelatedTopicDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<RelatedTopicDto>>> Get(
        int topicId,
        CancellationToken cancellationToken)
    {
        var topics = await service.GetPublicRelatedAsync(topicId, cancellationToken);
        if (topics is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy nội dung",
                Detail = "Nội dung không tồn tại hoặc không còn được công khai."
            });
        }

        return Ok(topics);
    }
}
