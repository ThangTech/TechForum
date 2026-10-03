using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/topics/{topicId:int}/answers")]
public sealed class AnswersController(IAnswerService answerService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResultDto<AnswerDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PagedResultDto<AnswerDto>>> GetAll(
        int topicId,
        [FromQuery] AnswerQuery query,
        CancellationToken cancellationToken)
    {
        var validationProblem = Validate(query);
        if (validationProblem is not null) return BadRequest(validationProblem);

        var page = await answerService.GetPublicPageAsync(topicId, query, cancellationToken);
        return page is null ? NotFound(CreateTopicNotFoundProblem()) : Ok(page);
    }

    [Authorize]
    [HttpPost]
    [ProducesResponseType<AnswerDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AnswerDto>> Create(
        int topicId,
        [FromBody] CreateAnswerRequest request,
        CancellationToken cancellationToken)
    {
        var authorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(authorId)) return Unauthorized();

        var result = await answerService.CreateAsync(
            topicId,
            authorId,
            request,
            cancellationToken);

        return result.Failure switch
        {
            CreateAnswerFailure.None => StatusCode(StatusCodes.Status201Created, result.Answer),
            CreateAnswerFailure.TopicNotFound => NotFound(CreateTopicNotFoundProblem()),
            CreateAnswerFailure.DiscussionLocked => Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Thảo luận đã bị khóa",
                Detail = result.Message
            }),
            CreateAnswerFailure.Validation => BadRequest(new ValidationProblemDetails(
                new Dictionary<string, string[]>
                {
                    [result.Field ?? "bodyHtml"] = [result.Message ?? "Câu trả lời chưa hợp lệ."]
                })
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Câu trả lời gửi lên chưa hợp lệ"
            }),
            _ => throw new InvalidOperationException("Trạng thái tạo câu trả lời không được hỗ trợ.")
        };
    }

    private static ValidationProblemDetails? Validate(AnswerQuery query)
    {
        var errors = new Dictionary<string, string[]>();
        if (query.Page < 1) errors["page"] = ["Trang phải lớn hơn hoặc bằng 1."];
        if (query.PageSize is < 1 or > 50)
            errors["pageSize"] = ["Số câu trả lời mỗi trang phải từ 1 đến 50."];

        return errors.Count == 0
            ? null
            : new ValidationProblemDetails(errors)
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Bộ lọc câu trả lời chưa hợp lệ"
            };
    }

    private static ProblemDetails CreateTopicNotFoundProblem() => new()
    {
        Status = StatusCodes.Status404NotFound,
        Title = "Không tìm thấy chủ đề",
        Detail = "Chủ đề không tồn tại hoặc không còn công khai."
    };
}
