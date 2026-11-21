using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
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
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
    public Task<ActionResult<MediaUploadDto>> UploadImage(
        IFormFile file,
        CancellationToken cancellationToken) =>
        StoreAsync(userId => mediaStorageService.StoreImageAsync(userId, file, cancellationToken));

    [HttpPost("videos")]
    [ProducesResponseType<MediaUploadDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
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
        var userId = User.GetRequiredUserId();
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
            MediaDeleteResult.Unavailable => StatusCode(StatusCodes.Status503ServiceUnavailable, new ProblemDetails
            {
                Status = StatusCodes.Status503ServiceUnavailable,
                Title = "Chưa xóa được media",
                Detail = "Không thể xóa tệp lúc này. Vui lòng thử lại sau."
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
        var result = await store(User.GetRequiredUserId());
        if (result.IsUnavailable)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new ProblemDetails
            {
                Status = StatusCodes.Status503ServiceUnavailable,
                Title = "Chưa thể lưu tệp",
                Detail = result.Error
            });
        }

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
        // A file of Cloudinary already has a full address. An old file of the disk is given with the address of this server.
        var link = media.Path.StartsWith("https://", StringComparison.Ordinal)
            ? media.Path
            : $"{Request.Scheme}://{Request.Host}{Request.PathBase}{media.Path}";
        return StatusCode(
            StatusCodes.Status201Created,
            media with { Link = link });
    }

}
