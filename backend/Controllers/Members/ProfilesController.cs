using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/profiles")]
public sealed class ProfilesController : ControllerBase
{
    private readonly IPublicProfileService profileService;
    private readonly IUserFollowService followService;
    private readonly IUserSkillService skillService;

    public ProfilesController(
        IPublicProfileService profileService,
        IUserFollowService followService,
        IUserSkillService skillService)
    {
        this.profileService = profileService;
        this.followService = followService;
        this.skillService = skillService;
    }

    // The skills that the signed-in member chose for their own profile.
    [Authorize]
    [HttpGet("me/skills")]
    public async Task<ActionResult<IReadOnlyList<SkillTagDto>>> GetMySkills(CancellationToken cancellationToken) =>
        Ok(await skillService.GetAsync(User.GetRequiredUserId(), cancellationToken));

    // Replaces the whole list: what is not in the request is removed. Only tags that already exist can be chosen.
    [Authorize]
    [HttpPut("me/skills")]
    public async Task<ActionResult<IReadOnlyList<SkillTagDto>>> SaveMySkills(SaveSkillsRequest request, CancellationToken cancellationToken)
    {
        var result = await skillService.ReplaceAsync(User.GetRequiredUserId(), request.TagIds!, cancellationToken);
        return this.ToActionResult(result);
    }

    [HttpGet("{userId}")]
    public async Task<ActionResult<PublicProfileDto>> GetByUserId(
        string userId,
        CancellationToken cancellationToken)
    {
        var profile = await profileService.GetByUserIdAsync(
            userId,
            User.GetUserIdOrNull(),
            cancellationToken);
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

    [HttpGet("{userId}/followers")]
    public Task<ActionResult<PagedResultDto<FollowMemberDto>>> GetFollowers(
        string userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        GetConnections(userId, true, page, pageSize, cancellationToken);

    [HttpGet("{userId}/following")]
    public Task<ActionResult<PagedResultDto<FollowMemberDto>>> GetFollowing(
        string userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        GetConnections(userId, false, page, pageSize, cancellationToken);

    [Authorize]
    [HttpPut("{userId}/follow")]
    public async Task<ActionResult<FollowStatusDto>> Follow(string userId, CancellationToken cancellationToken)
    {
        var result = await followService.FollowAsync(User.GetRequiredUserId(), userId, cancellationToken);
        return this.ToActionResult(result);
    }

    [Authorize]
    [HttpDelete("{userId}/follow")]
    public async Task<ActionResult<FollowStatusDto>> Unfollow(
        string userId,
        CancellationToken cancellationToken) =>
        Ok(await followService.UnfollowAsync(User.GetRequiredUserId(), userId, cancellationToken));

    private async Task<ActionResult<PagedResultDto<FollowMemberDto>>> GetConnections(
        string userId,
        bool followers,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        if (page < 1 || pageSize is < 1 or > 50)
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                [page < 1 ? "page" : "pageSize"] =
                    [page < 1 ? "Trang phải lớn hơn hoặc bằng 1." : "Số thành viên mỗi trang phải từ 1 đến 50."]
            }));
        }

        var result = await followService.GetConnectionsAsync(
            userId, followers, page, pageSize, cancellationToken);
        return result is null
            ? NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy thành viên" })
            : Ok(result);
    }
}
