using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Constants;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Administrator)]
[Route("api/admin/categories")]
public sealed class AdminCategoriesController(ICategoryService categoryService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminCategoryDto>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await categoryService.GetAdminAsync(cancellationToken));

    [HttpPost]
    public async Task<ActionResult<AdminCategoryDto>> Create(
        [FromBody] SaveCategoryRequest request,
        CancellationToken cancellationToken) =>
        ToActionResult(await categoryService.CreateAsync(GetAdministratorId(), request, cancellationToken), true);

    [HttpPut("{id:int}")]
    public async Task<ActionResult<AdminCategoryDto>> Update(
        int id,
        [FromBody] SaveCategoryRequest request,
        CancellationToken cancellationToken) =>
        ToActionResult(await categoryService.UpdateAsync(GetAdministratorId(), id, request, cancellationToken));

    [HttpPut("{id:int}/active")]
    public async Task<ActionResult<AdminCategoryDto>> SetActive(
        int id,
        [FromBody] SetActiveRequest request,
        CancellationToken cancellationToken) =>
        ToActionResult(await categoryService.SetActiveAsync(GetAdministratorId(), id, request.IsActive, cancellationToken));

    private string GetAdministratorId() => User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("Phiên quản trị thiếu định danh tài khoản.");

    private ActionResult<AdminCategoryDto> ToActionResult(CategoryWriteResult result, bool created = false) =>
        result.Failure switch
        {
            CategoryWriteFailure.None when created => StatusCode(StatusCodes.Status201Created, result.Category),
            CategoryWriteFailure.None => Ok(result.Category),
            CategoryWriteFailure.NotFound => NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy chuyên mục", Detail = result.Message }),
            CategoryWriteFailure.DuplicateSlug => Conflict(new ProblemDetails { Status = 409, Title = "Đường dẫn bị trùng", Detail = result.Message }),
            CategoryWriteFailure.Validation => BadRequest(new ValidationProblemDetails(
                new Dictionary<string, string[]> { [result.Field ?? "category"] = [result.Message ?? "Dữ liệu chưa hợp lệ."] })),
            _ => throw new InvalidOperationException("Trạng thái cập nhật chuyên mục không được hỗ trợ.")
        };
}
