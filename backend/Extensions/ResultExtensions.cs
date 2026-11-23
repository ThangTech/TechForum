using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Services;

namespace TechForum.Api.Extensions;

// Đổi Result của service thành câu trả lời HTTP ở một chỗ duy nhất, để controller chỉ còn vài dòng.
public static class ResultExtensions
{
    public static ActionResult ToActionResult(this ControllerBase controller, Result result)
    {
        if (result.Succeeded)
        {
            return controller.NoContent();
        }

        return ToProblem(controller, result);
    }

    public static ActionResult<T> ToActionResult<T>(this ControllerBase controller, Result<T> result, int successStatus = StatusCodes.Status200OK)
    {
        if (result.Succeeded)
        {
            return controller.StatusCode(successStatus, result.Value);
        }

        return ToProblem(controller, result);
    }

    private static ActionResult ToProblem(ControllerBase controller, Result result)
    {
        if (result.Error == ErrorType.Validation)
        {
            var errors = new Dictionary<string, string[]>
            {
                [result.Field ?? string.Empty] = [result.Message ?? "Dữ liệu chưa hợp lệ."]
            };
            // Tiêu đề để trống thì ValidationProblemMessageFilter điền tiêu đề tiếng Việt chung.
            return controller.BadRequest(new ValidationProblemDetails(errors) { Status = StatusCodes.Status400BadRequest, Title = result.Title });
        }

        var status = GetStatusCode(result.Error!.Value);
        if (result.Error == ErrorType.TooManyRequests)
        {
            controller.Response.Headers.RetryAfter = result.RetryAfterSeconds.ToString(CultureInfo.InvariantCulture);
        }

        return controller.StatusCode(status, new ProblemDetails { Status = status, Title = result.Title, Detail = result.Message });
    }

    private static int GetStatusCode(ErrorType error)
    {
        switch (error)
        {
            case ErrorType.Unauthorized:
                return StatusCodes.Status401Unauthorized;
            case ErrorType.Forbidden:
                return StatusCodes.Status403Forbidden;
            case ErrorType.NotFound:
                return StatusCodes.Status404NotFound;
            case ErrorType.Conflict:
                return StatusCodes.Status409Conflict;
            case ErrorType.Locked:
                return StatusCodes.Status423Locked;
            case ErrorType.TooManyRequests:
                return StatusCodes.Status429TooManyRequests;
            case ErrorType.Unavailable:
                return StatusCodes.Status503ServiceUnavailable;
            default:
                return StatusCodes.Status400BadRequest;
        }
    }
}
