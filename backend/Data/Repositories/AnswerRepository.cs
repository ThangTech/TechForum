using Microsoft.EntityFrameworkCore;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class AnswerRepository(TechForumDbContext dbContext) : IAnswerRepository
{
    public async Task<AnswerPage?> GetPublicPageAsync(
        int topicId,
        int page,
        int pageSize,
        int? aroundAnswerId,
        CancellationToken cancellationToken)
    {
        var answers = dbContext.Answers
            .AsNoTracking()
            .Where(answer =>
                answer.TopicId == topicId &&
                !answer.IsDeleted &&
                !answer.IsHiddenByModerator);

        if (aroundAnswerId.HasValue)
        {
            var target = await answers
                .Where(answer => answer.Id == aroundAnswerId.Value)
                .Select(answer => new { answer.Id, answer.CreatedAtUtc })
                .SingleOrDefaultAsync(cancellationToken);
            if (target is null) return null;

            // Dùng đúng thứ tự của danh sách để tìm trang, không tải các trang trước đó.
            var precedingCount = await answers.CountAsync(answer =>
                answer.CreatedAtUtc < target.CreatedAtUtc ||
                (answer.CreatedAtUtc == target.CreatedAtUtc && answer.Id < target.Id),
                cancellationToken);
            page = precedingCount / pageSize + 1;
        }

        var totalItems = await answers.CountAsync(cancellationToken);
        var items = await answers
            .OrderBy(answer => answer.CreatedAtUtc)
            .ThenBy(answer => answer.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(answer => answer.Author)
            .Include(answer => answer.ParentAnswer)
                .ThenInclude(parent => parent!.Author)
            .ToListAsync(cancellationToken);

        return new AnswerPage(items, totalItems, page);
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
            .Include(answer => answer.ParentAnswer)
                .ThenInclude(parent => parent!.Author)
            .SingleOrDefaultAsync(answer =>
                answer.Id == answerId &&
                answer.TopicId == topicId &&
                !answer.IsDeleted &&
                !answer.IsHiddenByModerator,
                cancellationToken);

    public Task<Answer?> GetOwnedByIdAsync(
        int topicId,
        int answerId,
        string authorId,
        CancellationToken cancellationToken) =>
        dbContext.Answers
            .Include(answer => answer.Author)
            .Include(answer => answer.Topic)
            .Include(answer => answer.ParentAnswer)
                .ThenInclude(parent => parent!.Author)
            .SingleOrDefaultAsync(answer =>
                answer.Id == answerId &&
                answer.TopicId == topicId &&
                answer.AuthorId == authorId &&
                !answer.IsDeleted,
                cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        dbContext.SaveChangesAsync(cancellationToken);
}
