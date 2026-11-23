using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public sealed class QuestionHighlightService : IQuestionHighlightService
{
    private readonly IQuestionHighlightRepository repository;
    private readonly TimeProvider timeProvider;

    public QuestionHighlightService(IQuestionHighlightRepository repository, TimeProvider timeProvider)
    {
        this.repository = repository;
        this.timeProvider = timeProvider;
    }

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
