using Microsoft.EntityFrameworkCore;
using TechForum.Api.Enums;

namespace TechForum.Api.Data.Repositories;

public sealed class QuestionHighlightRepository(TechForumDbContext dbContext) : IQuestionHighlightRepository
{
    public async Task<QuestionHighlightsData> GetAsync(
        DateTimeOffset periodStartUtc,
        int limit,
        CancellationToken cancellationToken)
    {
        var questions = dbContext.Topics
            .AsNoTracking()
            .Where(topic =>
                topic.Type == TopicType.Question &&
                topic.Status == TopicStatus.Published &&
                topic.PublishedAtUtc != null &&
                !topic.IsDeleted &&
                !topic.IsHiddenByModerator)
            .Select(topic => new QuestionHighlightData(
                topic.Id,
                topic.Title,
                topic.Answers.Count(answer => !answer.IsDeleted && !answer.IsHiddenByModerator),
                topic.PublishedAtUtc!.Value));

        var latest = await questions
            .OrderByDescending(item => item.PublishedAtUtc)
            .ThenByDescending(item => item.Id)
            .Take(limit)
            .ToListAsync(cancellationToken);
        var mostAnswered = await questions
            .Where(item => item.PublishedAtUtc >= periodStartUtc)
            .OrderByDescending(item => item.AnswerCount)
            .ThenByDescending(item => item.PublishedAtUtc)
            .ThenByDescending(item => item.Id)
            .Take(limit)
            .ToListAsync(cancellationToken);
        return new QuestionHighlightsData(latest, mostAnswered);
    }
}
