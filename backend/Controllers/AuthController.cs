using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
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
    IAvatarService avatarService,
    IAntiforgery antiforgery) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("antiforgery-token")]
    [ProducesResponseType<AntiforgeryTokenDto>(StatusCodes.Status200OK)]
    public ActionResult<AntiforgeryTokenDto> GetAntiforgeryToken()
    {
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);
        return Ok(new AntiforgeryTokenDto(tokens.RequestToken!));
    }

    [AllowAnonymous]
    [HttpPost("register")]
    [ProducesResponseType<CurrentUserDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CurrentUserDto>> Register(RegisterRequest request)
    {
        var result = await authService.RegisterAsync(request);
        if (result.Succeeded)
        {
            return StatusCode(StatusCodes.Status201Created, result.User);
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
    [ProducesResponseType<CurrentUserDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status423Locked)]
    public async Task<ActionResult<CurrentUserDto>> Login(LoginRequest request)
    {
        var result = await authService.LoginAsync(request);
        if (result.Succeeded)
        {
            return Ok(result.User);
        }

        if (result.Failure == AuthFailureKind.LockedOut)
        {
            return StatusCode(StatusCodes.Status423Locked, new ProblemDetails
            {
                Status = StatusCodes.Status423Locked,
                Title = "Tài khoản đang bị khóa",
                Detail = "Vui lòng liên hệ quản trị viên để được hỗ trợ."
            });
        }

        return Unauthorized(new ProblemDetails
        {
            Status = StatusCodes.Status401Unauthorized,
            Title = "Đăng nhập không thành công",
            Detail = "Email hoặc mật khẩu không chính xác."
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
    public async Task<ActionResult<CurrentUserDto>> ChangePassword(ChangePasswordRequest request)
    {
        var result = await authService.ChangePasswordAsync(GetUserId(), request);
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

    [Authorize]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout()
    {
        await authService.LogoutAsync();
        return NoContent();
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("Phiên đăng nhập thiếu định danh tài khoản.");

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
