namespace TechForum.Api.Dtos;

public sealed record BannerDto(Guid Id, string Title, string ImageUrl, string? LinkUrl);

public sealed record AdminBannerDto(
    Guid Id,
    string Title,
    string ImageUrl,
    string? LinkUrl,
    int DisplayOrder,
    bool IsActive,
    DateTimeOffset? StartsAtUtc,
    DateTimeOffset? EndsAtUtc,
    DateTimeOffset CreatedAtUtc);

public sealed record SaveBannerRequest(
    string? Title,
    string? ImageUrl,
    string? LinkUrl,
    int DisplayOrder,
    DateTimeOffset? StartsAtUtc,
    DateTimeOffset? EndsAtUtc);

public sealed record BannerImageDto(string ImageUrl);
