using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Constants;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Administrator)]
[Route("api/admin/tags")]
public sealed class AdminTagsController(ITagService tagService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminTagDto>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await tagService.GetAdminAsync(cancellationToken));

    [HttpPost]
    public async Task<ActionResult<AdminTagDto>> Create(
        [FromBody] SaveTagRequest request,
        CancellationToken cancellationToken) =>
        ToActionResult(await tagService.CreateAsync(GetAdministratorId(), request, cancellationToken), true);

    [HttpPut("{id:int}")]
    public async Task<ActionResult<AdminTagDto>> Update(
        int id,
        [FromBody] SaveTagRequest request,
        CancellationToken cancellationToken) =>
        ToActionResult(await tagService.UpdateAsync(GetAdministratorId(), id, request, cancellationToken));

    [HttpPut("{id:int}/active")]
    public async Task<ActionResult<AdminTagDto>> SetActive(
        int id,
        [FromBody] SetActiveRequest request,
        CancellationToken cancellationToken) =>
        ToActionResult(await tagService.SetActiveAsync(GetAdministratorId(), id, request.IsActive, cancellationToken));

    private string GetAdministratorId() => User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("Phiên quản trị thiếu định danh tài khoản.");

    private ActionResult<AdminTagDto> ToActionResult(TagWriteResult result, bool created = false) =>
        result.Failure switch
        {
            TagWriteFailure.None when created => StatusCode(StatusCodes.Status201Created, result.Tag),
            TagWriteFailure.None => Ok(result.Tag),
            TagWriteFailure.NotFound => NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy thẻ", Detail = result.Message }),
            TagWriteFailure.DuplicateSlug => Conflict(new ProblemDetails { Status = 409, Title = "Đường dẫn bị trùng", Detail = result.Message }),
            TagWriteFailure.Validation => BadRequest(new ValidationProblemDetails(
                new Dictionary<string, string[]> { [result.Field ?? "tag"] = [result.Message ?? "Dữ liệu chưa hợp lệ."] })),
            _ => throw new InvalidOperationException("Trạng thái cập nhật thẻ không được hỗ trợ.")
        };
}
