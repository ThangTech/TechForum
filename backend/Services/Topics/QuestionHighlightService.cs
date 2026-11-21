using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public sealed class QuestionHighlightService(
    IQuestionHighlightRepository repository,
    TimeProvider timeProvider) : IQuestionHighlightService
{
    public async Task<QuestionHighlightsDto> GetAsync(
        int periodDays,
        int limit,
        CancellationToken cancellationToken)
    {
        var result = await repository.GetAsync(
            timeProvider.GetUtcNow().AddDays(-periodDays),
            limit,
            cancellationToken);
        return new QuestionHighlightsDto(
            result.Latest.Select(Map).ToList(),
            result.MostAnswered.Select(Map).ToList(),
            periodDays);
    }

    private static QuestionHighlightDto Map(QuestionHighlightData item) =>
        new(item.Id, item.Title, item.AnswerCount, item.PublishedAtUtc);
}
