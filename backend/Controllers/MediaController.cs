using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        StoreAsync(() => mediaStorageService.StoreImageAsync(file, cancellationToken));

    [HttpPost("videos")]
    [ProducesResponseType<MediaUploadDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public Task<ActionResult<MediaUploadDto>> UploadVideo(
        IFormFile file,
        CancellationToken cancellationToken) =>
        StoreAsync(() => mediaStorageService.StoreVideoAsync(file, cancellationToken));

    private async Task<ActionResult<MediaUploadDto>> StoreAsync(Func<Task<MediaUploadResult>> store)
    {
        var result = await store();
        if (!result.Succeeded)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Tệp tải lên không hợp lệ",
                Detail = result.Error
            });
        }

        return StatusCode(StatusCodes.Status201Created, result.Media);
    }
}
