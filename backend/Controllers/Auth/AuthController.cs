using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos.Auth;
using TechForum.Api.Enums;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService authService;
    private readonly IAvatarService avatarService;

    public AuthController(IAuthService authService, IAvatarService avatarService)
    {
        this.authService = authService;
        this.avatarService = avatarService;
    }

    // Refresh token nằm trong cookie HttpOnly nên JavaScript không đọc được; cookie chỉ gửi tới /api/auth.
    private const string RefreshTokenCookieName = "TechForum.Refresh";
    private const string RefreshTokenCookiePath = "/api/auth";

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.RegisterAsync(request, cancellationToken);
        return ToSessionResponse(result, StatusCodes.Status201Created);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(request, cancellationToken);
        return ToSessionResponse(result, StatusCodes.Status200OK);
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh(CancellationToken cancellationToken)
    {
        var result = await authService.RefreshAsync(Request.Cookies[RefreshTokenCookieName], cancellationToken);
        if (!result.Succeeded)
        {
            // Cookie cũ không còn dùng được nữa.
            DeleteRefreshTokenCookie();
        }

        return ToSessionResponse(result, StatusCodes.Status200OK);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<CurrentUserDto>> GetCurrentUser()
    {
        var userId = User.GetUserIdOrNull();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var user = await authService.GetCurrentUserAsync(userId);
        return user is null ? Unauthorized() : Ok(user);
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<CurrentUserDto>> UpdateProfile(UpdateProfileRequest request)
    {
        var result = await authService.UpdateProfileAsync(User.GetRequiredUserId(), request);
        return this.ToActionResult(result);
    }

    [Authorize]
    [HttpPut("password")]
    public async Task<ActionResult<CurrentUserDto>> ChangePassword(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.ChangePasswordAsync(User.GetRequiredUserId(), request, cancellationToken);
        if (result.Succeeded)
        {
            // Mọi refresh token đã bị thu hồi nên cookie trong trình duyệt không còn tác dụng.
            DeleteRefreshTokenCookie();
        }

        return this.ToActionResult(result);
    }

    [Authorize]
    [HttpPost("avatar")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<CurrentUserDto>> UpdateAvatar(IFormFile file, CancellationToken cancellationToken)
    {
        var result = await avatarService.UpdateAsync(User.GetRequiredUserId(), file, cancellationToken);
        return this.ToActionResult(result);
    }

    [Authorize]
    [HttpDelete("avatar")]
    public async Task<ActionResult<CurrentUserDto>> DeleteAvatar(CancellationToken cancellationToken)
    {
        var result = await avatarService.DeleteAsync(User.GetRequiredUserId(), cancellationToken);
        return this.ToActionResult(result);
    }

    // Cho phép ẩn danh vì access token có thể đã hết hạn lúc người dùng đăng xuất.
    [AllowAnonymous]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var refreshToken = Request.Cookies[RefreshTokenCookieName];
        await authService.LogoutAsync(refreshToken, cancellationToken);
        DeleteRefreshTokenCookie();
        return NoContent();
    }

    // Đặt cookie refresh token và trả phần trình duyệt được giữ trong bộ nhớ.
    private ActionResult<AuthResponseDto> ToSessionResponse(Result<AuthSession> result, int successStatus)
    {
        if (!result.Succeeded)
        {
            return this.ToActionResult(Result<AuthResponseDto>.From(result));
        }

        var session = result.Value!;
        Response.Cookies.Append(RefreshTokenCookieName, session.Tokens.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Strict,
            Path = RefreshTokenCookiePath,
            Expires = session.Tokens.RefreshTokenExpiresAtUtc,
            IsEssential = true
        });

        var response = new AuthResponseDto(session.User, session.Tokens.AccessToken, session.Tokens.AccessTokenExpiresAtUtc);
        return StatusCode(successStatus, response);
    }

    private void DeleteRefreshTokenCookie()
    {
        Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions
        {
            Path = RefreshTokenCookiePath
        });
    }
}
