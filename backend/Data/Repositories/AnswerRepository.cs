using Microsoft.EntityFrameworkCore;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class AnswerRepository(TechForumDbContext dbContext) : IAnswerRepository
{
    public async Task<AnswerPage> GetPublicPageAsync(
        int topicId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var answers = dbContext.Answers
            .AsNoTracking()
            .Where(answer =>
                answer.TopicId == topicId &&
                !answer.IsDeleted &&
                !answer.IsHiddenByModerator);

        var totalItems = await answers.CountAsync(cancellationToken);
        var items = await answers
            .OrderBy(answer => answer.CreatedAtUtc)
            .ThenBy(answer => answer.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(answer => answer.Author)
            .ToListAsync(cancellationToken);

        return new AnswerPage(items, totalItems);
    }

    public async Task AddAsync(Answer answer, CancellationToken cancellationToken)
    {
        dbContext.Answers.Add(answer);
        await dbContext.SaveChangesAsync(cancellationToken);
        await dbContext.Entry(answer).Reference(item => item.Author).LoadAsync(cancellationToken);
    }

    public Task<Answer?> GetVisibleByIdAsync(
        int topicId,
        int answerId,
        CancellationToken cancellationToken) =>
        dbContext.Answers
            .AsNoTracking()
            .Include(answer => answer.Author)
            .SingleOrDefaultAsync(answer =>
                answer.Id == answerId &&
                answer.TopicId == topicId &&
                !answer.IsDeleted &&
                !answer.IsHiddenByModerator,
                cancellationToken);
}
