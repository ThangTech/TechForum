using System.Security.Claims;

namespace TechForum.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    // The id of the signed-in account, or null for a guest. Use it where guests are allowed.
    public static string? GetUserIdOrNull(this ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.NameIdentifier);

    // The id of the signed-in account for actions that need a login. The id comes from the
    // access token that the server checked, never from the request body.
    // A missing id here means the token has no user id, which is a server-side problem (HTTP 500).
    public static string GetRequiredUserId(this ClaimsPrincipal user) =>
        user.GetUserIdOrNull()
        ?? throw new InvalidOperationException("Phiên đăng nhập thiếu định danh tài khoản.");
}
