using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/profiles")]
public sealed class ProfilesController(
    IPublicProfileService profileService,
    IUserFollowService followService) : ControllerBase
{
    [HttpGet("{userId}")]
    [ProducesResponseType<PublicProfileDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PublicProfileDto>> GetByUserId(
        string userId,
        CancellationToken cancellationToken)
    {
        var profile = await profileService.GetByUserIdAsync(
            userId,
            User.FindFirstValue(ClaimTypes.NameIdentifier),
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

    [Authorize]
    [HttpPut("{userId}/follow")]
    public async Task<ActionResult<FollowStatusDto>> Follow(
        string userId,
        CancellationToken cancellationToken)
    {
        var result = await followService.FollowAsync(GetUserId(), userId, cancellationToken);
        return result.Failure switch
        {
            FollowFailure.None => Ok(result.Status),
            FollowFailure.NotFound => NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy thành viên" }),
            FollowFailure.SelfFollow => Conflict(new ProblemDetails { Status = 409, Title = "Bạn không thể tự theo dõi mình" }),
            _ => throw new InvalidOperationException("Trạng thái theo dõi không được hỗ trợ.")
        };
    }

    [Authorize]
    [HttpDelete("{userId}/follow")]
    public async Task<ActionResult<FollowStatusDto>> Unfollow(
        string userId,
        CancellationToken cancellationToken) =>
        Ok(await followService.UnfollowAsync(GetUserId(), userId, cancellationToken));

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("Phiên đăng nhập thiếu định danh tài khoản.");
}
