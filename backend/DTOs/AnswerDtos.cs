namespace TechForum.Api.Dtos;

public sealed record AnswerDto(
    int Id,
    int TopicId,
    int? ParentAnswerId,
    TopicAuthorDto? ReplyingTo,
    string BodyHtml,
    TopicAuthorDto Author,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc,
    bool IsAccepted,
    int HelpfulCount = 0,
    bool IsHelpful = false);

public sealed record AnswerHelpfulDto(int HelpfulCount, bool IsHelpful);

public sealed record CreateAnswerRequest(string? BodyHtml, int? ParentAnswerId = null);

public sealed class AnswerQuery
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public int? AroundAnswerId { get; init; }
    public string Sort { get; init; } = "oldest";
}
