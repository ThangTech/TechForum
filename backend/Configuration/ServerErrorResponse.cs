using Microsoft.AspNetCore.Http;

namespace TechForum.Api.Configuration;

public static class ServerErrorResponse
{
    public const string Title = "Đã xảy ra lỗi hệ thống";

    public const string Detail =
        "Vui lòng thử lại sau. Nếu lỗi lặp lại, hãy gửi mã theo dõi (traceId) cho quản trị viên.";

    // Mọi lỗi bất ngờ trả cùng một dạng JSON (problem details) kèm trace id trùng với "Request id" trong log.
    // Chỉ đổi lỗi 500; lỗi 400, 401, 403, 404 giữ nội dung riêng.
    public static void Customize(ProblemDetailsContext context)
    {
        var problem = context.ProblemDetails;
        if (problem.Status != StatusCodes.Status500InternalServerError)
        {
            return;
        }

        problem.Title = Title;
        problem.Detail = Detail;
        problem.Extensions["traceId"] = context.HttpContext.TraceIdentifier;

        // Chỉ hiện lỗi thật khi phát triển; ở môi trường khác nó có thể chứa chuỗi kết nối, đường dẫn hay SQL.
        var environment = context.HttpContext.RequestServices.GetRequiredService<IHostEnvironment>();
        if (environment.IsDevelopment() && context.Exception is not null)
        {
            problem.Detail = context.Exception.Message;
        }
    }
}
