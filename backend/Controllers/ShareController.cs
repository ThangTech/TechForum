using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

// Thẻ Open Graph cho bot mạng xã hội; Vercel chuyển /topics/{id} của các bot này về đây.
[ApiController]
[Route("share")]
public sealed class ShareController : ControllerBase
{
    private readonly IShareCardService service;

    public ShareController(IShareCardService service)
    {
        this.service = service;
    }

    [HttpGet("topics/{topicId:guid}")]
    public async Task<IActionResult> GetTopic(Guid topicId, CancellationToken cancellationToken)
    {
        var card = await service.GetTopicCardAsync(topicId, cancellationToken);
        return new ContentResult
        {
            Content = card.Html,
            ContentType = "text/html; charset=utf-8",
            StatusCode = card.Found ? StatusCodes.Status200OK : StatusCodes.Status404NotFound
        };
    }
}
