namespace TechForum.Api.Dtos;

public sealed record AdminCategoryDto(
    int Id,
    string Name,
    string Slug,
    string? Description,
    int DisplayOrder,
    bool IsActive,
    int TopicCount);

public sealed record SaveCategoryRequest(
    string? Name,
    string? Slug,
    string? Description,
    int DisplayOrder);

public sealed record SetActiveRequest(bool IsActive);
