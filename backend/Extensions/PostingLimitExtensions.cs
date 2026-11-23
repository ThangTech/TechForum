using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Services;

namespace TechForum.Api.Extensions;

// The answer of the API when a member publishes faster than the posting limits allow (429 with Retry-After).
public static class PostingLimitExtensions
{
    public static ObjectResult PostingTooFast(this ControllerBase controller, int retryAfterSeconds, string title, string action)
    {
        controller.Response.Headers.RetryAfter = retryAfterSeconds.ToString(CultureInfo.InvariantCulture);
        return controller.StatusCode(StatusCodes.Status429TooManyRequests, new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = title,
            Detail = $"Vui lòng chờ {MemberRateLimit.FormatWait(retryAfterSeconds)} rồi {action}."
        });
    }
}
