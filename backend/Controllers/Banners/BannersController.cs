using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/banners")]
public sealed class BannersController : ControllerBase
{
    private readonly IBannerService bannerService;

    public BannersController(IBannerService bannerService)
    {
        this.bannerService = bannerService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BannerDto>>> GetShown(CancellationToken cancellationToken)
    {
        return Ok(await bannerService.GetShownAsync(cancellationToken));
    }
}
