using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/topics")]
public sealed class TopicsController(ITopicService topicService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResultDto<TopicSummaryDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResultDto<TopicSummaryDto>>> GetAll(
        [FromQuery] TopicQuery query,
        CancellationToken cancellationToken)
    {
        var errors = Validate(query);
        if (errors.Count > 0)
        {
            return BadRequest(new ValidationProblemDetails(errors)
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Bộ lọc chủ đề chưa hợp lệ"
            });
        }

        return Ok(await topicService.GetPublicPageAsync(query, cancellationToken));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType<TopicDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TopicDetailDto>> GetById(
        int id,
        CancellationToken cancellationToken)
    {
        var topic = await topicService.GetPublicByIdAsync(id, cancellationToken);
        if (topic is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy nội dung",
                Detail = $"Không có nội dung công khai với mã {id}."
            });
        }

        return Ok(topic);
    }

    private static Dictionary<string, string[]> Validate(TopicQuery query)
    {
        var errors = new Dictionary<string, string[]>();
        if (query.Page < 1)
        {
            errors["page"] = ["Trang phải lớn hơn hoặc bằng 1."];
        }

        if (query.PageSize is < 1 or > 50)
        {
            errors["pageSize"] = ["Số phần tử mỗi trang phải từ 1 đến 50."];
        }

        if (query.Keyword?.Trim().Length > 100)
        {
            errors["keyword"] = ["Từ khóa không được vượt quá 100 ký tự."];
        }

        if (query.Type.HasValue && !Enum.IsDefined(query.Type.Value))
        {
            errors["type"] = ["Loại nội dung không hợp lệ."];
        }

        if (query.CategoryId is <= 0)
        {
            errors["categoryId"] = ["Mã chuyên mục phải lớn hơn 0."];
        }

        if (query.TagId is <= 0)
        {
            errors["tagId"] = ["Mã thẻ phải lớn hơn 0."];
        }

        return errors;
    }
}
