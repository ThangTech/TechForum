namespace TechForum.Api.Dtos;

public sealed record QuestionHighlightDto(
    Guid Id,
    string Title,
    int AnswerCount,
    DateTimeOffset PublishedAtUtc);

public sealed record QuestionHighlightsDto(
    IReadOnlyList<QuestionHighlightDto> Latest,
    IReadOnlyList<QuestionHighlightDto> MostAnswered,
    int PeriodDays);
