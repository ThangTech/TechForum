namespace TechForum.Api.Dtos;

// Mọi trường đều có thể để trống vì bản nháp được phép chưa xong.
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
