using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Extensions;

// The answer of the API for the result of a vote; the same for a vote on a post and a vote on an answer.
public static class VoteResultExtensions
{
    public static ActionResult<VoteDto> ToVoteResponse(this ControllerBase controller, VoteResult result)
    {
        switch (result.Failure)
        {
            case VoteFailure.None:
                return controller.Ok(result.Vote);
            case VoteFailure.NotFound:
                return controller.NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy nội dung" });
            case VoteFailure.OwnContent:
                return controller.Conflict(new ProblemDetails { Status = 409, Title = "Bạn không thể bình chọn nội dung của chính mình" });
            case VoteFailure.InvalidValue:
                return controller.BadRequest(new ProblemDetails { Status = 400, Title = "Giá trị bình chọn phải là 1, -1 hoặc 0" });
            case VoteFailure.AccountTooNew:
                return controller.StatusCode(StatusCodes.Status403Forbidden, new ProblemDetails
                {
                    Status = 403,
                    Title = "Tài khoản chưa đủ lâu để bình chọn",
                    Detail = $"Tài khoản cần được tạo ít nhất vài ngày mới được bình chọn. Bạn có thể bình chọn sau khoảng {result.DaysLeft} ngày nữa."
                });
            case VoteFailure.RateLimited:
                controller.Response.Headers.RetryAfter = result.RetryAfterSeconds.ToString(CultureInfo.InvariantCulture);
                return controller.StatusCode(StatusCodes.Status429TooManyRequests, new ProblemDetails
                {
                    Status = 429,
                    Title = "Bạn bình chọn quá nhanh",
                    Detail = result.RetryAfterSeconds >= 3600
                        ? $"Bạn đã dùng hết số lượt bình chọn trong ngày. Vui lòng thử lại sau {FormatWait(result.RetryAfterSeconds)}."
                        : $"Bạn đã bình chọn quá nhiều trong thời gian ngắn. Vui lòng thử lại sau {FormatWait(result.RetryAfterSeconds)}."
                });
            default:
                throw new InvalidOperationException("Kết quả bình chọn không được hỗ trợ.");
        }
    }

    // "30 giây", "5 phút", "2 giờ": a wait is told in the unit that a person can use.
    private static string FormatWait(int seconds) => seconds switch
    {
        < 90 => $"{seconds} giây",
        < 5400 => $"{(int)Math.Ceiling(seconds / 60.0)} phút",
        _ => $"{(int)Math.Ceiling(seconds / 3600.0)} giờ"
    };
}
