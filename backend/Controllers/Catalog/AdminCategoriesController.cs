using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Constants;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Administrator)]
[Route("api/admin/categories")]
public sealed class AdminCategoriesController : ControllerBase
{
    private readonly ICategoryService categoryService;

    public AdminCategoriesController(ICategoryService categoryService)
    {
        this.categoryService = categoryService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminCategoryDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await categoryService.GetAdminAsync(cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<AdminCategoryDto>> Create([FromBody] SaveCategoryRequest request, CancellationToken cancellationToken)
    {
        var result = await categoryService.CreateAsync(User.GetRequiredUserId(), request, cancellationToken);
        return this.ToActionResult(result, StatusCodes.Status201Created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminCategoryDto>> Update(Guid id, [FromBody] SaveCategoryRequest request, CancellationToken cancellationToken)
    {
        var result = await categoryService.UpdateAsync(User.GetRequiredUserId(), id, request, cancellationToken);
        return this.ToActionResult(result);
    }

    [HttpPut("{id:guid}/active")]
    public async Task<ActionResult<AdminCategoryDto>> SetActive(Guid id, [FromBody] SetActiveRequest request, CancellationToken cancellationToken)
    {
        var result = await categoryService.SetActiveAsync(User.GetRequiredUserId(), id, request.IsActive, cancellationToken);
        return this.ToActionResult(result);
    }
}
