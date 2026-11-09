using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public enum BannerWriteFailure
{
    None,
    Validation,
    NotFound
}

public sealed record BannerWriteResult(
    AdminBannerDto? Banner,
    BannerWriteFailure Failure,
    string? Field,
    string? Message)
{
    public static BannerWriteResult Success(AdminBannerDto banner) =>
        new(banner, BannerWriteFailure.None, null, null);

    public static BannerWriteResult Failed(BannerWriteFailure failure, string message, string? field = null) =>
        new(null, failure, field, message);
}

// The result of saving an uploaded banner picture.
public sealed record BannerImageResult(string? ImageUrl, string? Error)
{
    public bool Succeeded => ImageUrl is not null;

    public static BannerImageResult Success(string imageUrl) => new(imageUrl, null);

    public static BannerImageResult Invalid(string error) => new(null, error);
}
