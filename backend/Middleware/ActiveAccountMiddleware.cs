using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Constants;
using TechForum.Api.Models;

namespace TechForum.Api.Middleware;

// Runs after JWT validation. A valid token is still rejected when the account was locked
// or its security stamp changed (for example after a password change).
public sealed class ActiveAccountMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(
        HttpContext context,
        UserManager<ApplicationUser> userManager)
    {
        if (context.User.Identity?.IsAuthenticated != true)
        {
            await next(context);
            return;
        }

        var user = await userManager.GetUserAsync(context.User);
        var isLockedOut = user is not null && await userManager.IsLockedOutAsync(user);
        var stampClaim = context.User.FindFirst(AuthClaimTypes.SecurityStamp)?.Value;
        var isCurrentSession = user is not null && !string.IsNullOrWhiteSpace(stampClaim) &&
            string.Equals(user.SecurityStamp, stampClaim, StringComparison.Ordinal);
        if (isCurrentSession && !isLockedOut)
        {
            await next(context);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        await context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = StatusCodes.Status401Unauthorized,
            Title = "Phiên đăng nhập không còn hiệu lực",
            Detail = isLockedOut
                ? "Tài khoản đã bị khóa."
                : "Thông tin bảo mật đã thay đổi hoặc tài khoản không còn tồn tại. Vui lòng đăng nhập lại."
        });
    }
}
