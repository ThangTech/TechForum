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
public sealed class AdminBannedWordsController : ControllerBase
{
    private readonly IBannedWordService bannedWordService;

    public AdminBannedWordsController(IBannedWordService bannedWordService)
    {
        this.bannedWordService = bannedWordService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BannedWordDto>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await bannedWordService.GetAllAsync(cancellationToken));

    [HttpPost]
    public async Task<ActionResult<BannedWordDto>> Add([FromBody] SaveBannedWordRequest request, CancellationToken cancellationToken)
    {
        var result = await bannedWordService.AddAsync(User.GetRequiredUserId(), request, cancellationToken);
        return this.ToActionResult(result, StatusCodes.Status201Created);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Remove(Guid id, CancellationToken cancellationToken)
    {
        var result = await bannedWordService.RemoveAsync(User.GetRequiredUserId(), id, cancellationToken);
        return this.ToActionResult(result);
    }
}
