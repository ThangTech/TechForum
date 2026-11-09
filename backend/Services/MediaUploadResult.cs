using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

// IsUnavailable: the file is fine but the storage could not take it (Cloudinary is not set up or did not answer).
public sealed record MediaUploadResult(MediaUploadDto? Media, string? Error, bool IsUnavailable = false)
{
    public bool Succeeded => Media is not null;

    public static MediaUploadResult Success(Guid id, string link) =>
        new(new MediaUploadDto(id, link, link), null);

    public static MediaUploadResult Invalid(string error) => new(null, error);

    public static MediaUploadResult Unavailable(string error) => new(null, error, true);
}
