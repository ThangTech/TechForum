using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/topics/{topicId:guid}/related")]
public sealed class RelatedTopicsController : ControllerBase
{
    private readonly IRelatedTopicService service;

    public RelatedTopicsController(IRelatedTopicService service)
    {
        this.service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RelatedTopicDto>>> Get(
        Guid topicId,
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
