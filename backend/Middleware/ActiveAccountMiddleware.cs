using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Models;

namespace TechForum.Api.Middleware;

public sealed class ActiveAccountMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(
        HttpContext context,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager)
    {
        if (context.User.Identity?.IsAuthenticated != true)
        {
            await next(context);
            return;
        }

        var user = await userManager.GetUserAsync(context.User);
        var isLockedOut = user is not null && await userManager.IsLockedOutAsync(user);
        var stampClaim = context.User.FindFirst(userManager.Options.ClaimsIdentity.SecurityStampClaimType)?.Value;
        var isCurrentSession = user is not null && !string.IsNullOrWhiteSpace(stampClaim) &&
            string.Equals(user.SecurityStamp, stampClaim, StringComparison.Ordinal);
        if (isCurrentSession && !isLockedOut)
        {
            await next(context);
            return;
        }

        await signInManager.SignOutAsync();
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
