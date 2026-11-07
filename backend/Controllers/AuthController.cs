using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos.Auth;
using TechForum.Api.Enums;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    IAuthService authService,
    IAvatarService avatarService) : ControllerBase
{
    // The refresh token lives in an HttpOnly cookie, so JavaScript cannot read it.
    // The cookie is only sent to /api/auth, where refresh and logout are handled.
    private const string RefreshTokenCookieName = "TechForum.Refresh";
    private const string RefreshTokenCookiePath = "/api/auth";

    [AllowAnonymous]
    [HttpPost("register")]
    [ProducesResponseType<AuthResponseDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponseDto>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var result = await authService.RegisterAsync(request, cancellationToken);
        if (result.Succeeded)
        {
            return StatusCode(StatusCodes.Status201Created, CreateAuthResponse(result));
        }

        if (result.Failure == AuthFailureKind.DuplicateEmail)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Email đã được sử dụng",
                Detail = "Vui lòng đăng nhập hoặc dùng một email khác."
            });
        }

        return BadRequest(new ValidationProblemDetails(
            result.Errors.ToDictionary(error => error.Key, error => error.Value))
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Thông tin đăng ký chưa hợp lệ"
        });
    }

    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType<AuthResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status423Locked)]
    public async Task<ActionResult<AuthResponseDto>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(request, cancellationToken);
        if (result.Succeeded)
        {
            return Ok(CreateAuthResponse(result));
        }

        if (result.Failure == AuthFailureKind.LockedOut)
        {
            return CreateLockedResponse();
        }

        return Unauthorized(new ProblemDetails
        {
            Status = StatusCodes.Status401Unauthorized,
            Title = "Đăng nhập không thành công",
            Detail = "Email hoặc mật khẩu không chính xác."
        });
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    [ProducesResponseType<AuthResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status423Locked)]
    public async Task<ActionResult<AuthResponseDto>> Refresh(CancellationToken cancellationToken)
    {
        var refreshToken = Request.Cookies[RefreshTokenCookieName];
        var result = await authService.RefreshAsync(refreshToken, cancellationToken);
        if (result.Succeeded)
        {
            return Ok(CreateAuthResponse(result));
        }

        DeleteRefreshTokenCookie();
        if (result.Failure == AuthFailureKind.LockedOut)
        {
            return CreateLockedResponse();
        }

        return Unauthorized(new ProblemDetails
        {
            Status = StatusCodes.Status401Unauthorized,
            Title = "Phiên đăng nhập đã hết hạn",
            Detail = "Vui lòng đăng nhập lại."
        });
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType<CurrentUserDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CurrentUserDto>> GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var user = await authService.GetCurrentUserAsync(userId);
        return user is null ? Unauthorized() : Ok(user);
    }

    [Authorize]
    [HttpPut("profile")]
    [ProducesResponseType<CurrentUserDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CurrentUserDto>> UpdateProfile(UpdateProfileRequest request)
    {
        var result = await authService.UpdateProfileAsync(GetUserId(), request);
        return ToAccountUpdateResponse(result, "Không thể cập nhật hồ sơ");
    }

    [Authorize]
    [HttpPut("password")]
    [ProducesResponseType<CurrentUserDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CurrentUserDto>> ChangePassword(
        ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        var result = await authService.ChangePasswordAsync(GetUserId(), request, cancellationToken);
        if (result.Succeeded)
        {
            // Every refresh token was revoked, so the browser cookie is no longer useful.
            DeleteRefreshTokenCookie();
        }

        return ToAccountUpdateResponse(result, "Không thể đổi mật khẩu");
    }

    [Authorize]
    [HttpPost("avatar")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType<CurrentUserDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CurrentUserDto>> UpdateAvatar(IFormFile file, CancellationToken cancellationToken)
    {
        var result = await avatarService.UpdateAsync(GetUserId(), file, cancellationToken);
        return result.Succeeded
            ? Ok(result.User)
            : BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]> { ["file"] = [result.Error!] })
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Avatar chưa hợp lệ"
            });
    }

    [Authorize]
    [HttpDelete("avatar")]
    [ProducesResponseType<CurrentUserDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CurrentUserDto>> DeleteAvatar(CancellationToken cancellationToken)
    {
        var result = await avatarService.DeleteAsync(GetUserId(), cancellationToken);
        return result.Succeeded ? Ok(result.User) : Unauthorized();
    }

    // Anonymous on purpose: the access token may already be expired when the user logs out.
    [AllowAnonymous]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var refreshToken = Request.Cookies[RefreshTokenCookieName];
        await authService.LogoutAsync(refreshToken, cancellationToken);
        DeleteRefreshTokenCookie();
        return NoContent();
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("Phiên đăng nhập thiếu định danh tài khoản.");

    // Sets the refresh token cookie and returns the part of the result the browser may keep in memory.
    private AuthResponseDto CreateAuthResponse(AuthResult result)
    {
        var tokens = result.Tokens!;
        Response.Cookies.Append(RefreshTokenCookieName, tokens.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Strict,
            Path = RefreshTokenCookiePath,
            Expires = tokens.RefreshTokenExpiresAtUtc,
            IsEssential = true
        });

        return new AuthResponseDto(
            result.User!,
            tokens.AccessToken,
            tokens.AccessTokenExpiresAtUtc);
    }

    private void DeleteRefreshTokenCookie()
    {
        Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions
        {
            Path = RefreshTokenCookiePath
        });
    }

    private ObjectResult CreateLockedResponse() => StatusCode(StatusCodes.Status423Locked, new ProblemDetails
    {
        Status = StatusCodes.Status423Locked,
        Title = "Tài khoản đang bị khóa",
        Detail = "Vui lòng liên hệ quản trị viên để được hỗ trợ."
    });

    private ActionResult<CurrentUserDto> ToAccountUpdateResponse(
        AuthResult result,
        string title)
    {
        if (result.Succeeded)
        {
            return Ok(result.User);
        }

        if (result.Failure == AuthFailureKind.InvalidCredentials)
        {
            return Unauthorized();
        }

        return BadRequest(new ValidationProblemDetails(
            result.Errors.ToDictionary(error => error.Key, error => error.Value))
        {
            Status = StatusCodes.Status400BadRequest,
            Title = title
        });
    }
}
