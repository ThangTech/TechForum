using TechForum.Api.Filters;

namespace TechForum.Api.Dtos;

public sealed record CreateTopicRequest(
    [property: FilterProfanity] string? Title,
    [property: FilterProfanity] string? Summary,
    [property: FilterProfanity(IsHtml = true)] string? BodyHtml,
    string? Type,
    int CategoryId,
    IReadOnlyList<int>? TagIds,
    IReadOnlyList<Guid>? MediaIds,
    bool Publish);
