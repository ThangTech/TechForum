using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Constants;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Administrator)]
[Route("api/admin/accounts")]
public sealed class AdminAccountsController(IAdminAccountService accountService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResultDto<AdminAccountDto>>> GetPage(
        [FromQuery] string? keyword = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (keyword?.Trim().Length > 100)
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["keyword"] = ["Từ khóa không được vượt quá 100 ký tự."]
            }));
        return Ok(await accountService.GetPageAsync(keyword, page, pageSize, cancellationToken));
    }

    [HttpPut("{userId}/lock")]
    public async Task<ActionResult<AdminAccountDto>> SetLocked(
        string userId,
        [FromBody] SetAccountLockRequest request)
    {
        var administratorId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Phiên quản trị thiếu định danh tài khoản.");
        var result = await accountService.SetLockedAsync(userId, administratorId, request.IsLocked);
        return result.Failure switch
        {
            AdminAccountWriteFailure.None => Ok(result.Account),
            AdminAccountWriteFailure.NotFound => NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy tài khoản", Detail = result.Message }),
            AdminAccountWriteFailure.SelfLock or AdminAccountWriteFailure.AdministratorProtected => Conflict(new ProblemDetails { Status = 409, Title = "Không thể khóa tài khoản", Detail = result.Message }),
            AdminAccountWriteFailure.UpdateFailed => StatusCode(500, new ProblemDetails { Status = 500, Title = "Không thể cập nhật tài khoản", Detail = result.Message }),
            _ => throw new InvalidOperationException("Trạng thái cập nhật tài khoản không được hỗ trợ.")
        };
    }
}
