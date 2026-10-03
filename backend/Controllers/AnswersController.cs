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

    [Authorize]
    [HttpPut("{answerId:int}/accepted")]
    [ProducesResponseType<AnswerDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AnswerDto>> Accept(
        int topicId,
        int answerId,
        CancellationToken cancellationToken)
    {
        var authorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(authorId)) return Unauthorized();

        var result = await answerService.AcceptAsync(
            topicId,
            answerId,
            authorId,
            cancellationToken);

        return result.Failure switch
        {
            AcceptAnswerFailure.None => Ok(result.Answer),
            AcceptAnswerFailure.NotFound => NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không thể chọn câu trả lời",
                Detail = "Chủ đề hoặc câu trả lời không tồn tại, không công khai hoặc không thuộc quyền quản lý của bạn."
            }),
            AcceptAnswerFailure.NotQuestion => Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Chỉ câu hỏi mới có câu trả lời được chấp nhận"
            }),
            _ => throw new InvalidOperationException("Trạng thái chọn câu trả lời không được hỗ trợ.")
        };
    }

    [Authorize]
    [HttpPut("{answerId:int}")]
    public async Task<ActionResult<AnswerDto>> Update(
        int topicId,
        int answerId,
        [FromBody] CreateAnswerRequest request,
        CancellationToken cancellationToken)
    {
        var result = await answerService.UpdateAsync(
            topicId, answerId, GetUserId(), request, cancellationToken);
        return result.Failure switch
        {
            UpdateAnswerFailure.None => Ok(result.Answer),
            UpdateAnswerFailure.NotFound => NotFound(new ProblemDetails
            {
                Status = 404,
                Title = "Không tìm thấy câu trả lời",
                Detail = result.Message
            }),
            UpdateAnswerFailure.Validation => BadRequest(new ValidationProblemDetails(
                new Dictionary<string, string[]> { [result.Field ?? "bodyHtml"] = [result.Message ?? "Câu trả lời chưa hợp lệ."] })),
            _ => throw new InvalidOperationException("Trạng thái sửa câu trả lời không được hỗ trợ.")
        };
    }

    [Authorize]
    [HttpDelete("{answerId:int}")]
    public async Task<IActionResult> Delete(
        int topicId,
        int answerId,
        CancellationToken cancellationToken)
    {
        var deleted = await answerService.DeleteAsync(
            topicId, answerId, GetUserId(), cancellationToken);
        return deleted ? NoContent() : NotFound(new ProblemDetails
        {
            Status = 404,
            Title = "Không tìm thấy câu trả lời",
            Detail = "Câu trả lời không tồn tại hoặc không thuộc tài khoản của bạn."
        });
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("Phiên đăng nhập thiếu định danh tài khoản.");

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
