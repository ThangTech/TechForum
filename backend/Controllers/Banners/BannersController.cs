using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

// The banners the home page shows right now. Everybody can read them.
[ApiController]
[Route("api/banners")]
public sealed class BannersController(IBannerService bannerService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BannerDto>>> GetShown(CancellationToken cancellationToken) =>
        Ok(await bannerService.GetShownAsync(cancellationToken));
}
