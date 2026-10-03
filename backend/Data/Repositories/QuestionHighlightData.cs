namespace TechForum.Api.Data.Repositories;

public sealed record QuestionHighlightData(
    int Id,
    string Title,
    int AnswerCount,
    DateTimeOffset PublishedAtUtc);

public sealed record QuestionHighlightsData(
    IReadOnlyList<QuestionHighlightData> Latest,
    IReadOnlyList<QuestionHighlightData> MostAnswered);
