using Microsoft.AspNetCore.Mvc;

namespace TechForum.Api.Controllers;

// Cho dịch vụ "ping" giữ API trên Render không ngủ. Không đụng tới database, nên không đánh thức Azure SQL
// và không tốn hạn mức vCore miễn phí.
[ApiController]
[Route("api/health")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "ok" });
    }
}
