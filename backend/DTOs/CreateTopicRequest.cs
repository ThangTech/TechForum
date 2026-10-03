namespace TechForum.Api.Dtos;

public sealed record CreateTopicRequest(
    string? Title,
    string? Summary,
    string? BodyHtml,
    string? Type,
    int CategoryId,
    IReadOnlyList<int>? TagIds,
    bool Publish);
