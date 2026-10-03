using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
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

    [Authorize]
    [HttpGet("mine")]
    [ProducesResponseType<PagedResultDto<OwnTopicSummaryDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResultDto<OwnTopicSummaryDto>>> GetMine(
        [FromQuery] TopicQuery query,
        CancellationToken cancellationToken)
    {
        var authorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(authorId))
        {
            return Unauthorized();
        }

        var errors = Validate(query);
        if (errors.Count > 0)
        {
            return BadRequest(new ValidationProblemDetails(errors)
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Bộ lọc nội dung chưa hợp lệ"
            });
        }

        return Ok(await topicService.GetOwnedPageAsync(authorId, query, cancellationToken));
    }

    [Authorize]
    [HttpGet("mine/{id:int}")]
    [ProducesResponseType<OwnTopicDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OwnTopicDto>> GetMineById(
        int id,
        CancellationToken cancellationToken)
    {
        var topic = await topicService.GetOwnedByIdAsync(id, GetUserId(), cancellationToken);
        return topic is null
            ? NotFound(CreateNotFoundProblem())
            : Ok(topic);
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

    [Authorize]
    [HttpPost]
    [ProducesResponseType<OwnTopicDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<OwnTopicDto>> Create(
        [FromBody] CreateTopicRequest request,
        CancellationToken cancellationToken)
    {
        var authorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(authorId))
        {
            return Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Bạn cần đăng nhập"
            });
        }

        var result = await topicService.CreateAsync(authorId, request, cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new ValidationProblemDetails(
                result.Errors.ToDictionary(item => item.Key, item => item.Value))
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Nội dung gửi lên chưa hợp lệ"
            });
        }

        return StatusCode(StatusCodes.Status201Created, result.Topic);
    }

    [Authorize]
    [HttpPut("{id:int}")]
    [ProducesResponseType<OwnTopicDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OwnTopicDto>> Update(
        int id,
        [FromBody] UpdateTopicRequest request,
        CancellationToken cancellationToken)
    {
        var result = await topicService.UpdateAsync(id, GetUserId(), request, cancellationToken);
        if (result is null) return NotFound(CreateNotFoundProblem());
        if (!result.Succeeded)
        {
            return BadRequest(new ValidationProblemDetails(
                result.Errors.ToDictionary(item => item.Key, item => item.Value))
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Nội dung gửi lên chưa hợp lệ"
            });
        }

        return Ok(result.Topic);
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var deleted = await topicService.SoftDeleteAsync(id, GetUserId(), cancellationToken);
        return deleted ? NoContent() : NotFound(CreateNotFoundProblem());
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("Phiên đăng nhập thiếu định danh tài khoản.");

    private static ProblemDetails CreateNotFoundProblem() => new()
    {
        Status = StatusCodes.Status404NotFound,
        Title = "Không tìm thấy nội dung",
        Detail = "Nội dung không tồn tại hoặc không thuộc tài khoản này."
    };

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
