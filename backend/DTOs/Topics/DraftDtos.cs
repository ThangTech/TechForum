namespace TechForum.Api.Dtos;

// The same fields as the "write a topic" form. Every field may be empty, because a draft can be unfinished.
public sealed record SaveDraftRequest(
    Guid? TopicId,
    string? Title,
    string? Summary,
    string? BodyHtml,
    string? Type,
    Guid? CategoryId,
    IReadOnlyList<Guid>? TagIds,
    IReadOnlyList<Guid>? MediaIds);

public sealed record DraftDto(
    Guid Id,
    Guid? TopicId,
    string Title,
    string Summary,
    string BodyHtml,
    string Type,
    Guid? CategoryId,
    IReadOnlyList<Guid> TagIds,
    IReadOnlyList<TopicMediaDto> Media,
    DateTimeOffset UpdatedAtUtc);
