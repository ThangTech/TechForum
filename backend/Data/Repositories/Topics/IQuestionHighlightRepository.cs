namespace TechForum.Api.Data.Repositories;

public interface IQuestionHighlightRepository
{
    Task<QuestionHighlightsData> GetAsync(
        DateTimeOffset periodStartUtc,
        int limit,
        CancellationToken cancellationToken);
}
