using Microsoft.AspNetCore.Http;

namespace TechForum.Api.Configuration;

public static class ServerErrorResponse
{
    public const string Title = "Đã xảy ra lỗi hệ thống";

    public const string Detail =
        "Vui lòng thử lại sau. Nếu lỗi lặp lại, hãy gửi mã theo dõi (traceId) cho quản trị viên.";

    // Every unexpected error answers with the same JSON shape (RFC 9457 problem details), instead of an
    // empty page. The trace id is the same "Request id" that appears in the server log for this error.
    // Only 500 answers are changed; validation, 401, 403 and 404 answers keep their own texts.
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

        // While developing, show the real message. In other environments it can contain
        // connection strings, file paths or SQL, so it stays in the log only.
        var environment = context.HttpContext.RequestServices.GetRequiredService<IHostEnvironment>();
        if (environment.IsDevelopment() && context.Exception is not null)
        {
            problem.Detail = context.Exception.Message;
        }
    }
}
