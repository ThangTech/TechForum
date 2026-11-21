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
public sealed class AdminCategoriesController(ICategoryService categoryService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminCategoryDto>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await categoryService.GetAdminAsync(cancellationToken));

    [HttpPost]
    public async Task<ActionResult<AdminCategoryDto>> Create(
        [FromBody] SaveCategoryRequest request,
        CancellationToken cancellationToken) =>
        ToActionResult(await categoryService.CreateAsync(User.GetRequiredUserId(), request, cancellationToken), true);

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminCategoryDto>> Update(
        Guid id,
        [FromBody] SaveCategoryRequest request,
        CancellationToken cancellationToken) =>
        ToActionResult(await categoryService.UpdateAsync(User.GetRequiredUserId(), id, request, cancellationToken));

    [HttpPut("{id:guid}/active")]
    public async Task<ActionResult<AdminCategoryDto>> SetActive(
        Guid id,
        [FromBody] SetActiveRequest request,
        CancellationToken cancellationToken) =>
        ToActionResult(await categoryService.SetActiveAsync(User.GetRequiredUserId(), id, request.IsActive, cancellationToken));


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
