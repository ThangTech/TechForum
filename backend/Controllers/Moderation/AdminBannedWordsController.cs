using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Constants;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

// The list of words that are replaced by "***" in posts and answers. Only administrators can read or change it.
[ApiController]
[Authorize(Roles = RoleNames.Administrator)]
[Route("api/admin/banned-words")]
public sealed class AdminBannedWordsController(IBannedWordService bannedWordService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BannedWordDto>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await bannedWordService.GetAllAsync(cancellationToken));

    [HttpPost]
    [ProducesResponseType<BannedWordDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<BannedWordDto>> Add(
        [FromBody] SaveBannedWordRequest request,
        CancellationToken cancellationToken)
    {
        var result = await bannedWordService.AddAsync(User.GetRequiredUserId(), request, cancellationToken);
        return result.Failure switch
        {
            BannedWordFailure.None => StatusCode(StatusCodes.Status201Created, result.Word),
            BannedWordFailure.Duplicate => Conflict(new ProblemDetails { Status = 409, Title = "Từ cấm bị trùng", Detail = result.Message }),
            BannedWordFailure.Validation => BadRequest(new ValidationProblemDetails(
                new Dictionary<string, string[]> { ["word"] = [result.Message ?? "Từ cấm chưa hợp lệ."] })),
            _ => throw new InvalidOperationException("Trạng thái thêm từ cấm không được hỗ trợ.")
        };
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Remove(Guid id, CancellationToken cancellationToken)
    {
        var result = await bannedWordService.RemoveAsync(User.GetRequiredUserId(), id, cancellationToken);
        return result.Failure == BannedWordFailure.None
            ? NoContent()
            : NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy từ cấm", Detail = result.Message });
    }
}
