using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Constants;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Administrator)]
[Route("api/admin/tags")]
public sealed class AdminTagsController : ControllerBase
{
    private readonly ITagService tagService;

    public AdminTagsController(ITagService tagService)
    {
        this.tagService = tagService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminTagDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await tagService.GetAdminAsync(cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<AdminTagDto>> Create([FromBody] SaveTagRequest request, CancellationToken cancellationToken)
    {
        var result = await tagService.CreateAsync(User.GetRequiredUserId(), request, cancellationToken);
        return this.ToActionResult(result, StatusCodes.Status201Created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminTagDto>> Update(Guid id, [FromBody] SaveTagRequest request, CancellationToken cancellationToken)
    {
        var result = await tagService.UpdateAsync(User.GetRequiredUserId(), id, request, cancellationToken);
        return this.ToActionResult(result);
    }

    [HttpPut("{id:guid}/active")]
    public async Task<ActionResult<AdminTagDto>> SetActive(Guid id, [FromBody] SetActiveRequest request, CancellationToken cancellationToken)
    {
        var result = await tagService.SetActiveAsync(User.GetRequiredUserId(), id, request.IsActive, cancellationToken);
        return this.ToActionResult(result);
    }
}
