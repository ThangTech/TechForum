using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/profiles")]
public sealed class ProfilesController(IPublicProfileService profileService) : ControllerBase
{
    [HttpGet("{userId}")]
    [ProducesResponseType<PublicProfileDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PublicProfileDto>> GetByUserId(
        string userId,
        CancellationToken cancellationToken)
    {
        var profile = await profileService.GetByUserIdAsync(userId, cancellationToken);
        if (profile is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy hồ sơ",
                Detail = "Tài khoản này không tồn tại."
            });
        }

        return Ok(profile);
    }
}
