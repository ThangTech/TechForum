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

    [Authorize]
    [HttpGet("me/skills")]
    public async Task<ActionResult<IReadOnlyList<SkillTagDto>>> GetMySkills(CancellationToken cancellationToken)
    {
        return Ok(await skillService.GetAsync(User.GetRequiredUserId(), cancellationToken));
    }

    // Thay cả danh sách: kỹ năng không có trong yêu cầu sẽ bị bỏ.
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
    public async Task<ActionResult<PagedResultDto<FollowMemberDto>>> GetFollowers(string userId, [FromQuery] PageQuery query, CancellationToken cancellationToken)
    {
        return await GetConnections(userId, true, query, cancellationToken);
    }

    [HttpGet("{userId}/following")]
    public async Task<ActionResult<PagedResultDto<FollowMemberDto>>> GetFollowing(string userId, [FromQuery] PageQuery query, CancellationToken cancellationToken)
    {
        return await GetConnections(userId, false, query, cancellationToken);
    }

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
        CancellationToken cancellationToken)
    {
        return Ok(await followService.UnfollowAsync(User.GetRequiredUserId(), userId, cancellationToken));
    }

    private async Task<ActionResult<PagedResultDto<FollowMemberDto>>> GetConnections(
        string userId, bool followers, PageQuery query, CancellationToken cancellationToken)
    {
        var result = await followService.GetConnectionsAsync(userId, followers, query.Page, query.PageSize, cancellationToken);
        if (result is null)
        {
            return NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy thành viên" });
        }

        return Ok(result);
    }
}
