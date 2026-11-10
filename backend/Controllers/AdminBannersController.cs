using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Constants;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Administrator)]
[Route("api/admin/banners")]
public sealed class AdminBannersController(IBannerService bannerService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminBannerDto>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await bannerService.GetAdminAsync(cancellationToken));

    [HttpPost]
    public async Task<ActionResult<AdminBannerDto>> Create(
        [FromBody] SaveBannerRequest request,
        CancellationToken cancellationToken) =>
        ToActionResult(await bannerService.CreateAsync(User.GetRequiredUserId(), request, cancellationToken), true);

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminBannerDto>> Update(
        Guid id,
        [FromBody] SaveBannerRequest request,
        CancellationToken cancellationToken) =>
        ToActionResult(await bannerService.UpdateAsync(User.GetRequiredUserId(), id, request, cancellationToken));

    [HttpPut("{id:guid}/active")]
    public async Task<ActionResult<AdminBannerDto>> SetActive(
        Guid id,
        [FromBody] SetActiveRequest request,
        CancellationToken cancellationToken) =>
        ToActionResult(await bannerService.SetActiveAsync(User.GetRequiredUserId(), id, request.IsActive, cancellationToken));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await bannerService.DeleteAsync(User.GetRequiredUserId(), id, cancellationToken);
        return result.Failure == BannerWriteFailure.None ? NoContent() : NotFoundResult(result);
    }

    // Uploads the picture first; the address in the answer goes into the banner form.
    [HttpPost("image")]
    [ProducesResponseType<BannerImageDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BannerImageDto>> UploadImage(IFormFile file, CancellationToken cancellationToken)
    {
        var result = await bannerService.UploadImageAsync(file, cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Ảnh banner không hợp lệ",
                Detail = result.Error
            });
        }

        return StatusCode(StatusCodes.Status201Created, new BannerImageDto(result.ImageUrl!));
    }

    private ActionResult<AdminBannerDto> ToActionResult(BannerWriteResult result, bool created = false) =>
        result.Failure switch
        {
            BannerWriteFailure.None when created => StatusCode(StatusCodes.Status201Created, result.Banner),
            BannerWriteFailure.None => Ok(result.Banner),
            BannerWriteFailure.NotFound => NotFoundResult(result),
            BannerWriteFailure.Validation => BadRequest(new ValidationProblemDetails(
                new Dictionary<string, string[]> { [result.Field ?? "banner"] = [result.Message ?? "Dữ liệu chưa hợp lệ."] })),
            _ => throw new InvalidOperationException("Trạng thái cập nhật banner không được hỗ trợ.")
        };

    private NotFoundObjectResult NotFoundResult(BannerWriteResult result) =>
        NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy banner", Detail = result.Message });
}
