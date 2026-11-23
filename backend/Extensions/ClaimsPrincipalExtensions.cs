using System.Security.Claims;

namespace TechForum.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static string? GetUserIdOrNull(this ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    // Id lấy từ access token mà server đã kiểm tra, không bao giờ từ body. Thiếu id là lỗi phía server (500).
    public static string GetRequiredUserId(this ClaimsPrincipal user)
    {
        return user.GetUserIdOrNull()
            ?? throw new InvalidOperationException("Phiên đăng nhập thiếu định danh tài khoản.");
    }
}
