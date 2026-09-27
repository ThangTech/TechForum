namespace TechForum.Api.Dtos;

public sealed record CategoryDto(
    int Id,
    string Name,
    string Slug,
    string? Description,
    int DisplayOrder);
