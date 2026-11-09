using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Extensions;

// The answer of the API for the result of a vote; the same for a vote on a post and a vote on an answer.
public static class VoteResultExtensions
{
    public static ActionResult<VoteDto> ToVoteResponse(this ControllerBase controller, VoteResult result) => result.Failure switch
    {
        VoteFailure.None => controller.Ok(result.Vote),
        VoteFailure.NotFound => controller.NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy nội dung" }),
        VoteFailure.OwnContent => controller.Conflict(new ProblemDetails { Status = 409, Title = "Bạn không thể bình chọn nội dung của chính mình" }),
        VoteFailure.InvalidValue => controller.BadRequest(new ProblemDetails { Status = 400, Title = "Giá trị bình chọn phải là 1, -1 hoặc 0" }),
        _ => throw new InvalidOperationException("Kết quả bình chọn không được hỗ trợ.")
    };
}
