namespace TechForum.Api.Dtos;

// The same fields as the "write a topic" form. Every field may be empty, because a draft can be unfinished.
public sealed record SaveDraftRequest(
    int? TopicId,
    string? Title,
    string? Summary,
    string? BodyHtml,
    string? Type,
    int? CategoryId,
    IReadOnlyList<int>? TagIds,
    IReadOnlyList<Guid>? MediaIds);

public sealed record DraftDto(
    Guid Id,
    int? TopicId,
    string Title,
    string Summary,
    string BodyHtml,
    string Type,
    int? CategoryId,
    IReadOnlyList<int> TagIds,
    IReadOnlyList<TopicMediaDto> Media,
    DateTimeOffset UpdatedAtUtc);
