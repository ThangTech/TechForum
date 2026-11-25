using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TechForum.Api.Dtos.Auth;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Route("api/auth/email-verification")]
public sealed class EmailVerificationController : ControllerBase
{
    private readonly IEmailVerificationService verificationService;

    public EmailVerificationController(IEmailVerificationService verificationService)
    {
        this.verificationService = verificationService;
    }

    // Gửi lại email xác minh cho tài khoản đang đăng nhập.
    [Authorize]
    [HttpPost]
    [EnableRateLimiting("verify-email")]
    public async Task<IActionResult> Resend(CancellationToken cancellationToken)
    {
        var result = await verificationService.ResendAsync(User.GetRequiredUserId(), cancellationToken);
        return this.ToActionResult(result);
    }

    // Không cần đăng nhập: người dùng có thể mở link trên thiết bị khác.
    [AllowAnonymous]
    [HttpPost("confirm")]
    [EnableRateLimiting("reset-password")]
    public async Task<IActionResult> Confirm(ConfirmEmailRequest request, CancellationToken cancellationToken)
    {
        var result = await verificationService.ConfirmAsync(request, cancellationToken);
        return this.ToActionResult(result);
    }
}
