namespace TechForum.Api.Dtos;

public sealed record AdminTagDto(
    int Id,
    string Name,
    string Slug,
    string? Description,
    bool IsActive,
    int TopicCount);

public sealed record SaveTagRequest(
    string? Name,
    string? Slug,
    string? Description);
