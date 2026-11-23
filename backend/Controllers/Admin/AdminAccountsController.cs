using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Constants;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Administrator)]
[Route("api/admin/accounts")]
public sealed class AdminAccountsController : ControllerBase
{
    private readonly IAdminAccountService accountService;

    public AdminAccountsController(IAdminAccountService accountService)
    {
        this.accountService = accountService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<AdminAccountDto>>> GetPage(
        [FromQuery] string? keyword = null,
        [FromQuery] string? status = null,
        [FromQuery] string? role = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (keyword?.Trim().Length > 100)
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["keyword"] = ["Từ khóa không được vượt quá 100 ký tự."]
            }));
        }
        status = status?.Trim().ToLowerInvariant();
        role = role?.Trim().ToLowerInvariant();
        if (status is not (null or "" or "locked" or "unlocked") || role is not (null or "" or "administrator" or "member"))
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["filters"] = ["Trạng thái phải là locked/unlocked, vai trò phải là administrator/member."]
            }));
        }
        return Ok(await accountService.GetPageAsync(keyword, status, role, page, pageSize, cancellationToken));
    }

    [HttpPut("{userId}/lock")]
    public async Task<ActionResult<AdminAccountDto>> SetLocked(string userId, [FromBody] SetAccountLockRequest request, CancellationToken cancellationToken)
    {
        var result = await accountService.SetLockedAsync(userId, User.GetRequiredUserId(), request, cancellationToken);
        return this.ToActionResult(result);
    }
}
