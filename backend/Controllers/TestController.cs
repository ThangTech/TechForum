using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace TechForum.Api.Controllers
{
    [Route("api/test")]
    [ApiController]
    public class TestController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new
            {
                status = "ok",
                application = "TechForum.Api",
                timestamp = DateTimeOffset.UtcNow
            });
        }
    }
}
