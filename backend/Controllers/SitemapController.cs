using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

// Vercel (và nginx khi chạy Docker) chuyển https://<trang web>/sitemap.xml về đây.
[ApiController]
[Route("sitemap.xml")]
public sealed class SitemapController : ControllerBase
{
    private readonly ISitemapService service;

    public SitemapController(ISitemapService service)
    {
        this.service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await service.BuildAsync(cancellationToken);
        if (!result.Succeeded)
        {
            return this.ToActionResult((Result)result);
        }
        return Content(result.Value!, "application/xml; charset=utf-8");
    }
}
