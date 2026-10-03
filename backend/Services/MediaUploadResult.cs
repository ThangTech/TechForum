using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public sealed record MediaUploadResult(MediaUploadDto? Media, string? Error)
{
    public bool Succeeded => Media is not null;

    public static MediaUploadResult Success(Guid id, string link) =>
        new(new MediaUploadDto(id, link), null);

    public static MediaUploadResult Invalid(string error) => new(null, error);
}
