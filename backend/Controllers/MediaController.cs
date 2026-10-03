using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TechForum.Api.Dtos;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/media")]
public sealed class MediaController(IMediaStorageService mediaStorageService) : ControllerBase
{
    [HttpPost("images")]
    [ProducesResponseType<MediaUploadDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public Task<ActionResult<MediaUploadDto>> UploadImage(
        IFormFile file,
        CancellationToken cancellationToken) =>
        StoreAsync(userId => mediaStorageService.StoreImageAsync(userId, file, cancellationToken));

    [HttpPost("videos")]
    [ProducesResponseType<MediaUploadDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public Task<ActionResult<MediaUploadDto>> UploadVideo(
        IFormFile file,
        CancellationToken cancellationToken) =>
        StoreAsync(userId => mediaStorageService.StoreVideoAsync(userId, file, cancellationToken));

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteUnused(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await mediaStorageService.DeleteUnusedAsync(userId, id, cancellationToken);
        return result switch
        {
            MediaDeleteResult.Deleted => NoContent(),
            MediaDeleteResult.Attached => Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Media đang được sử dụng",
                Detail = "Không thể xóa media đã gắn với nội dung."
            }),
            _ => NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Không tìm thấy media"
            })
        };
    }

    private async Task<ActionResult<MediaUploadDto>> StoreAsync(
        Func<string, Task<MediaUploadResult>> store)
    {
        var result = await store(GetUserId());
        if (!result.Succeeded)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Tệp tải lên không hợp lệ",
                Detail = result.Error
            });
        }

        var media = result.Media!;
        var absoluteLink = $"{Request.Scheme}://{Request.Host}{Request.PathBase}{media.Path}";
        return StatusCode(
            StatusCodes.Status201Created,
            media with { Link = absoluteLink });
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("Phiên đăng nhập thiếu định danh tài khoản.");
}
