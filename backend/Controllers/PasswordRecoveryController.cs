using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TechForum.Api.Dtos.Auth;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/auth")]
public sealed class PasswordRecoveryController(IPasswordRecoveryService recoveryService) : ControllerBase
{
    [HttpPost("forgot-password")]
    [EnableRateLimiting("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        var startedAt = System.Diagnostics.Stopwatch.StartNew();
        var isAvailable = await recoveryService.RequestAsync(request.Email, cancellationToken);
        var remainingDelay = TimeSpan.FromMilliseconds(500) - startedAt.Elapsed;
        if (remainingDelay > TimeSpan.Zero) await Task.Delay(remainingDelay, cancellationToken);
        if (!isAvailable)
        {
            return StatusCode(503, new ProblemDetails
            {
                Status = 503,
                Title = "Chưa thể gửi email khôi phục",
                Detail = "Dịch vụ email chưa được cấu hình. Vui lòng liên hệ quản trị viên."
            });
        }
        return Accepted(new { message = "Nếu email khớp với tài khoản, bạn sẽ nhận được liên kết đặt lại mật khẩu. Vui lòng kiểm tra cả thư mục thư rác." });
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        if (await recoveryService.ResetAsync(request)) return NoContent();
        return BadRequest(new ProblemDetails
        {
            Status = 400,
            Title = "Không thể đặt lại mật khẩu",
            Detail = "Liên kết không hợp lệ, đã hết hạn hoặc mật khẩu chưa đạt yêu cầu: 8–100 ký tự, có chữ hoa, chữ thường, chữ số và ký tự đặc biệt."
        });
    }
}
