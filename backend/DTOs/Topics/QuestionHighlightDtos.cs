using System.ComponentModel.DataAnnotations;
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

public sealed class QuestionHighlightQuery
{
    [Range(7, 365, ErrorMessage = "Khoảng thời gian phải từ 7 đến 365 ngày.")]
    public int PeriodDays { get; init; } = 30;

    [Range(1, 10, ErrorMessage = "Số câu hỏi mỗi nhóm phải từ 1 đến 10.")]
    public int Limit { get; init; } = 5;
}
