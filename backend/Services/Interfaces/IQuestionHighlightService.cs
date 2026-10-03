using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IQuestionHighlightService
{
    Task<QuestionHighlightsDto> GetAsync(
        int periodDays,
        int limit,
        CancellationToken cancellationToken);
}
