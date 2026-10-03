namespace TechForum.Api.Dtos;

public sealed record AnswerDto(
    int Id,
    int TopicId,
    string BodyHtml,
    TopicAuthorDto Author,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc,
    bool IsAccepted);

public sealed record CreateAnswerRequest(string? BodyHtml);

public sealed class AnswerQuery
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
