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
public sealed class AdminBannersController : ControllerBase
{
    private readonly IBannerService bannerService;

    public AdminBannersController(IBannerService bannerService)
    {
        this.bannerService = bannerService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminBannerDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await bannerService.GetAdminAsync(cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<AdminBannerDto>> Create([FromBody] SaveBannerRequest request, CancellationToken cancellationToken)
    {
        var result = await bannerService.CreateAsync(User.GetRequiredUserId(), request, cancellationToken);
        return this.ToActionResult(result, StatusCodes.Status201Created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminBannerDto>> Update(Guid id, [FromBody] SaveBannerRequest request, CancellationToken cancellationToken)
    {
        var result = await bannerService.UpdateAsync(User.GetRequiredUserId(), id, request, cancellationToken);
        return this.ToActionResult(result);
    }

    [HttpPut("{id:guid}/active")]
    public async Task<ActionResult<AdminBannerDto>> SetActive(Guid id, [FromBody] SetActiveRequest request, CancellationToken cancellationToken)
    {
        var result = await bannerService.SetActiveAsync(User.GetRequiredUserId(), id, request.IsActive, cancellationToken);
        return this.ToActionResult(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await bannerService.DeleteAsync(User.GetRequiredUserId(), id, cancellationToken);
        return this.ToActionResult(result);
    }

    // Tải ảnh trước; địa chỉ trả về được điền vào form banner.
    [HttpPost("image")]
    public async Task<ActionResult<BannerImageDto>> UploadImage(IFormFile file, CancellationToken cancellationToken)
    {
        var result = await bannerService.UploadImageAsync(file, cancellationToken);
        if (!result.Succeeded)
        {
            return this.ToActionResult(Result<BannerImageDto>.From(result));
        }

        return StatusCode(StatusCodes.Status201Created, new BannerImageDto(result.Value!));
    }
}
