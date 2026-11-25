using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using TechForum.Api.Middleware;
using TechForum.Api.Models;

namespace TechForum.Api.Filters;

// Gắn lên action đăng nội dung (bài viết, câu trả lời, bình chọn, báo cáo, tải tệp). Tài khoản chưa xác minh email
// vẫn đọc được nhưng chưa được đăng, để không ai dùng email của người khác mà đăng bài hay spam.
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class RequireVerifiedEmailAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.Items[ActiveAccountMiddleware.CurrentUserItemKey] as ApplicationUser;
        if (user is null || user.EmailConfirmed)
        {
            return;
        }

        context.Result = new ObjectResult(new ProblemDetails
        {
            Status = StatusCodes.Status403Forbidden,
            Title = "Bạn cần xác minh email",
            Detail = $"Mở link trong email đã gửi tới {user.Email} để xác minh, hoặc gửi lại email ở thanh thông báo đầu trang."
        })
        {
            StatusCode = StatusCodes.Status403Forbidden
        };
    }
}
