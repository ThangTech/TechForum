using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/question-highlights")]
public sealed class QuestionHighlightsController : ControllerBase
{
    private readonly IQuestionHighlightService service;

    public QuestionHighlightsController(IQuestionHighlightService service)
    {
        this.service = service;
    }

    [HttpGet]
    public async Task<ActionResult<QuestionHighlightsDto>> Get([FromQuery] QuestionHighlightQuery query, CancellationToken cancellationToken)
    {
        return Ok(await service.GetAsync(query.PeriodDays, query.Limit, cancellationToken));
    }
}
