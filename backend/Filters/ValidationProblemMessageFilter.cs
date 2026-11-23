using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using TechForum.Api.Configuration;

namespace TechForum.Api.Filters;

// Lỗi validation nào cũng nhận tiêu đề và mô tả tiếng Việt, để trang không bao giờ hiện
// "One or more validation errors occurred.".
public sealed class ValidationProblemMessageFilter : IAlwaysRunResultFilter
{
    public void OnResultExecuting(ResultExecutingContext context)
    {
        if (context.Result is ObjectResult { Value: ValidationProblemDetails problem })
        {
            ApiErrorMessages.Apply(problem);
        }
    }

    public void OnResultExecuted(ResultExecutedContext context)
    {
    }
}
