namespace TechForum.Api.Dtos;

public sealed record TagDto(
    int Id,
    string Name,
    string Slug,
    string? Description);
