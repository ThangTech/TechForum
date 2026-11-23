using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Extensions;
using TechForum.Api.Filters;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[ProfanityFilter]
[Route("api/topics")]
public sealed class TopicsController : ControllerBase
{
    private readonly ITopicService topicService;

    public TopicsController(ITopicService topicService)
    {
        this.topicService = topicService;
    }

    [HttpGet]
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
    [HttpGet("following")]
    public async Task<ActionResult<PagedResultDto<TopicSummaryDto>>> GetFollowing(
        [FromQuery] TopicQuery query,
        CancellationToken cancellationToken)
    {
        var followerId = User.GetUserIdOrNull();
        if (string.IsNullOrWhiteSpace(followerId))
        {
            return Unauthorized();
        }

        var errors = Validate(query);
        if (errors.Count > 0)
        {
            return BadRequest(new ValidationProblemDetails(errors)
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Bộ lọc chủ đề chưa hợp lệ"
            });
        }

        return Ok(await topicService.GetFollowingPageAsync(followerId, query, cancellationToken));
    }

    [Authorize]
    [HttpGet("mine")]
    public async Task<ActionResult<PagedResultDto<OwnTopicSummaryDto>>> GetMine(
        [FromQuery] TopicQuery query,
        CancellationToken cancellationToken)
    {
        var authorId = User.GetUserIdOrNull();
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
    [HttpGet("mine/{id:guid}")]
    public async Task<ActionResult<OwnTopicDto>> GetMineById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var topic = await topicService.GetOwnedByIdAsync(id, User.GetRequiredUserId(), cancellationToken);
        return topic is null
            ? NotFound(CreateNotFoundProblem())
            : Ok(topic);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TopicDetailDto>> GetById(
        Guid id,
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
    public async Task<ActionResult<OwnTopicDto>> Create([FromBody] CreateTopicRequest request, CancellationToken cancellationToken)
    {
        var result = await topicService.CreateAsync(User.GetRequiredUserId(), request, cancellationToken);
        return this.ToActionResult(result, StatusCodes.Status201Created);
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<OwnTopicDto>> Update(Guid id, [FromBody] UpdateTopicRequest request, CancellationToken cancellationToken)
    {
        var result = await topicService.UpdateAsync(id, User.GetRequiredUserId(), request, cancellationToken);
        return this.ToActionResult(result);
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await topicService.SoftDeleteAsync(id, User.GetRequiredUserId(), cancellationToken);
        return this.ToActionResult(result);
    }

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

        if (query.CategoryId == Guid.Empty)
        {
            errors["categoryId"] = ["Mã chuyên mục phải lớn hơn 0."];
        }

        if (query.TagId == Guid.Empty)
        {
            errors["tagId"] = ["Mã thẻ phải lớn hơn 0."];
        }

        if (query.Sort is not null &&
            !string.Equals(query.Sort, "discussion", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(query.Sort, "weekly", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(query.Sort, "hot", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(query.Sort, "top", StringComparison.OrdinalIgnoreCase))
        {
            errors["sort"] = ["Kiểu sắp xếp chỉ hỗ trợ 'discussion', 'weekly', 'hot' hoặc 'top'."];
        }

        if (query.Range is not null &&
            query.Range.ToLowerInvariant() is not ("day" or "week" or "month" or "all"))
        {
            errors["range"] = ["Khoảng thời gian chỉ hỗ trợ 'day', 'week', 'month' hoặc 'all'."];
        }

        if (query.QuestionStatus is not null)
        {
            if (query.QuestionStatus is not ("unanswered" or "unsolved" or "solved"))
            {
                errors["questionStatus"] = ["Trạng thái câu hỏi không hợp lệ."];
            }
            if (query.Type == TopicType.Article)
            {
                errors["questionStatus"] = ["Bộ lọc trạng thái chỉ dùng cho câu hỏi."];
            }
        }

        return errors;
    }
}
