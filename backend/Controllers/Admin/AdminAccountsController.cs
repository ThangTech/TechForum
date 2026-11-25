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
    public async Task<ActionResult<PagedResultDto<AdminAccountDto>>> GetPage([FromQuery] AdminAccountQuery query, CancellationToken cancellationToken)
    {
        return Ok(await accountService.GetPageAsync(query.Keyword, query.Status, query.Role, query.Page, query.PageSize, cancellationToken));
    }

    [HttpPut("{userId}/lock")]
    public async Task<ActionResult<AdminAccountDto>> SetLocked(string userId, [FromBody] SetAccountLockRequest request, CancellationToken cancellationToken)
    {
        var result = await accountService.SetLockedAsync(userId, User.GetRequiredUserId(), request, cancellationToken);
        return this.ToActionResult(result);
    }

    [HttpPut("{userId}/role")]
    public async Task<ActionResult<AdminAccountDto>> SetRole(string userId, [FromBody] SetAccountRoleRequest request, CancellationToken cancellationToken)
    {
        var result = await accountService.SetRoleAsync(userId, User.GetRequiredUserId(), request, cancellationToken);
        return this.ToActionResult(result);
    }
}
