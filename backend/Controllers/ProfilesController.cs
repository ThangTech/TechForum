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
