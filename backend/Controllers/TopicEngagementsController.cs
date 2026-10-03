using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/topics/{topicId:int}")]
public sealed class TopicEngagementsController(ITopicEngagementService engagementService) : ControllerBase
{
    private const string VisitorCookie = "TechForum.Visitor";

    [HttpPost("view")]
    public async Task<ActionResult<TopicEngagementDto>> RecordView(int topicId, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var visitorKey = userId is null ? GetOrCreateVisitorKey() : $"user:{userId}";
        var result = await engagementService.RecordViewAsync(topicId, visitorKey, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("share")]
    public async Task<ActionResult<TopicEngagementDto>> RecordShare(int topicId, CancellationToken cancellationToken)
    {
        var result = await engagementService.RecordShareAsync(topicId, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    private string GetOrCreateVisitorKey()
    {
        if (Request.Cookies.TryGetValue(VisitorCookie, out var existing) && Guid.TryParse(existing, out _))
            return $"guest:{existing}";
        var value = Guid.NewGuid().ToString("N");
        Response.Cookies.Append(VisitorCookie, value, new CookieOptions
        {
            HttpOnly = true,
            IsEssential = true,
            SameSite = SameSiteMode.Lax,
            Secure = Request.IsHttps,
            MaxAge = TimeSpan.FromDays(365)
        });
        return $"guest:{value}";
    }
}
