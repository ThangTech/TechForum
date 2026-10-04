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
                !topic.IsHiddenByModerator);

        var latest = await questions
            .OrderByDescending(topic => topic.PublishedAtUtc)
            .ThenByDescending(topic => topic.Id)
            .Take(limit)
            .Select(topic => new QuestionHighlightData(
                topic.Id,
                topic.Title,
                topic.Answers.Count(answer => !answer.IsDeleted && !answer.IsHiddenByModerator),
                topic.PublishedAtUtc!.Value))
            .ToListAsync(cancellationToken);
        var mostAnswered = await questions
            .Where(topic => topic.PublishedAtUtc >= periodStartUtc)
            .OrderByDescending(topic => topic.Answers.Count(answer =>
                !answer.IsDeleted && !answer.IsHiddenByModerator))
            .ThenByDescending(topic => topic.PublishedAtUtc)
            .ThenByDescending(topic => topic.Id)
            .Take(limit)
            .Select(topic => new QuestionHighlightData(
                topic.Id,
                topic.Title,
                topic.Answers.Count(answer => !answer.IsDeleted && !answer.IsHiddenByModerator),
                topic.PublishedAtUtc!.Value))
            .ToListAsync(cancellationToken);
        return new QuestionHighlightsData(latest, mostAnswered);
    }
}
