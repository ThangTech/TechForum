namespace TechForum.Api.Dtos;

public sealed record TagDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description);
