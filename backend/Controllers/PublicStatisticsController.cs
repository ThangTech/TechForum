using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/statistics")]
public sealed class PublicStatisticsController(IPublicStatisticsService service) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PublicStatisticsDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PublicStatisticsDto>> Get(CancellationToken cancellationToken) =>
        Ok(await service.GetAsync(cancellationToken));
}
