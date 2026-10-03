using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/question-highlights")]
public sealed class QuestionHighlightsController(IQuestionHighlightService service) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<QuestionHighlightsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<QuestionHighlightsDto>> Get(
        [FromQuery] int periodDays = 30,
        [FromQuery] int limit = 5,
        CancellationToken cancellationToken = default)
    {
        var errors = new Dictionary<string, string[]>();
        if (periodDays is < 7 or > 365) errors["periodDays"] = ["Khoảng thời gian phải từ 7 đến 365 ngày."];
        if (limit is < 1 or > 10) errors["limit"] = ["Số câu hỏi mỗi nhóm phải từ 1 đến 10."];
        if (errors.Count > 0) return BadRequest(new ValidationProblemDetails(errors)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Bộ lọc câu hỏi nổi bật chưa hợp lệ"
        });
        return Ok(await service.GetAsync(periodDays, limit, cancellationToken));
    }
}
