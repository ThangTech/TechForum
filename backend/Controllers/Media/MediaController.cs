using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechForum.Api.Dtos;
using TechForum.Api.Extensions;
using TechForum.Api.Filters;
using TechForum.Api.Services;

namespace TechForum.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/media")]
public sealed class MediaController : ControllerBase
{
    private readonly IMediaStorageService mediaStorageService;

    public MediaController(IMediaStorageService mediaStorageService)
    {
        this.mediaStorageService = mediaStorageService;
    }

    [HttpPost("images")]
    [RequireVerifiedEmail]
    public async Task<ActionResult<MediaUploadDto>> UploadImage(IFormFile file, CancellationToken cancellationToken)
    {
        var result = await mediaStorageService.StoreImageAsync(User.GetRequiredUserId(), file, cancellationToken);
        return ToUploadResponse(result);
    }

    [HttpPost("videos")]
    [VideoUploadSizeLimit]
    [RequireVerifiedEmail]
    public async Task<ActionResult<MediaUploadDto>> UploadVideo(IFormFile file, CancellationToken cancellationToken)
    {
        var result = await mediaStorageService.StoreVideoAsync(User.GetRequiredUserId(), file, cancellationToken);
        return ToUploadResponse(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteUnused(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediaStorageService.DeleteUnusedAsync(User.GetRequiredUserId(), id, cancellationToken);
        return this.ToActionResult(result);
    }

    private ActionResult<MediaUploadDto> ToUploadResponse(Result<MediaUploadDto> result)
    {
        if (!result.Succeeded)
        {
            return this.ToActionResult(result);
        }

        // Tệp trên Cloudinary đã có địa chỉ đầy đủ; tệp cũ lưu trên đĩa thì ghép với địa chỉ của server này.
        var media = result.Value!;
        var link = media.Path.StartsWith("https://", StringComparison.Ordinal)
            ? media.Path
            : $"{Request.Scheme}://{Request.Host}{Request.PathBase}{media.Path}";
        return StatusCode(StatusCodes.Status201Created, media with { Link = link });
    }
}
