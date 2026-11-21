using TechForum.Api.Filters;

namespace TechForum.Api.Dtos;

public sealed record CreateTopicRequest(
    [property: FilterProfanity] string? Title,
    [property: FilterProfanity] string? Summary,
    [property: FilterProfanity(IsHtml = true)] string? BodyHtml,
    string? Type,
    Guid CategoryId,
    IReadOnlyList<Guid>? TagIds,
    IReadOnlyList<Guid>? MediaIds,
    bool Publish);
