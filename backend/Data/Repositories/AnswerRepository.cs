using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class AnswerRepository(TechForumDbContext dbContext) : IAnswerRepository
{
    public async Task<AnswerPage?> GetPublicPageAsync(
        int topicId,
        int page,
        int pageSize,
        int? aroundAnswerId,
        string sort,
        CancellationToken cancellationToken)
    {
        var answers = PublicAnswers(topicId);

        if (aroundAnswerId.HasValue)
        {
            var target = await answers
                .Where(answer => answer.Id == aroundAnswerId.Value)
                .Select(answer => new { answer.Id, answer.CreatedAtUtc, HelpfulCount = answer.HelpfulVotes.Count })
                .SingleOrDefaultAsync(cancellationToken);
            if (target is null) return null;

            // Dùng đúng thứ tự của danh sách để tìm trang, không tải các trang trước đó.
            var precedingCount = sort == "helpful"
                ? await answers.CountAsync(answer =>
                    answer.HelpfulVotes.Count > target.HelpfulCount ||
                    (answer.HelpfulVotes.Count == target.HelpfulCount &&
                        (answer.CreatedAtUtc < target.CreatedAtUtc ||
                        (answer.CreatedAtUtc == target.CreatedAtUtc && answer.Id < target.Id))),
                    cancellationToken)
                : await answers.CountAsync(answer =>
                    answer.CreatedAtUtc < target.CreatedAtUtc ||
                    (answer.CreatedAtUtc == target.CreatedAtUtc && answer.Id < target.Id),
                    cancellationToken);
            page = precedingCount / pageSize + 1;
        }

        var totalItems = await answers.CountAsync(cancellationToken);
        var orderedAnswers = sort == "helpful"
            ? answers.OrderByDescending(answer => answer.HelpfulVotes.Count)
                .ThenBy(answer => answer.CreatedAtUtc).ThenBy(answer => answer.Id)
            : answers.OrderBy(answer => answer.CreatedAtUtc).ThenBy(answer => answer.Id);
        var items = await orderedAnswers
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(answer => answer.Author)
            .Include(answer => answer.ParentAnswer)
                .ThenInclude(parent => parent!.Author)
            .ToListAsync(cancellationToken);

        return new AnswerPage(items, totalItems, page);
    }

    public async Task<IReadOnlyList<AnswerHelpfulState>> GetHelpfulStatesAsync(
        IReadOnlyCollection<int> answerIds,
        string? viewerId,
        CancellationToken cancellationToken) =>
        await dbContext.Answers.AsNoTracking()
            .Where(answer => answerIds.Contains(answer.Id))
            .Select(answer => new AnswerHelpfulState(
                answer.Id,
                answer.HelpfulVotes.Count,
                viewerId != null && answer.HelpfulVotes.Any(vote => vote.UserId == viewerId)))
            .ToListAsync(cancellationToken);

    public async Task AddHelpfulIfMissingAsync(AnswerHelpfulVote vote, CancellationToken cancellationToken)
    {
        if (await dbContext.AnswerHelpfulVotes.AnyAsync(item =>
            item.AnswerId == vote.AnswerId && item.UserId == vote.UserId, cancellationToken)) return;

        dbContext.AnswerHelpfulVotes.Add(vote);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            // Hai lần bấm đồng thời vẫn chỉ tạo một lượt bình chọn.
            dbContext.Entry(vote).State = EntityState.Detached;
        }
    }

    public async Task RemoveHelpfulAsync(int answerId, string userId, CancellationToken cancellationToken)
    {
        await dbContext.AnswerHelpfulVotes
            .Where(vote => vote.AnswerId == answerId && vote.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);
    }

    private IQueryable<Answer> PublicAnswers(int topicId) =>
        dbContext.Answers.AsNoTracking().Where(answer =>
            answer.TopicId == topicId &&
            !answer.IsDeleted && !answer.IsHiddenByModerator &&
            (answer.ParentAnswerId == null ||
                (answer.ParentAnswer != null && answer.ParentAnswer.TopicId == topicId &&
                 answer.ParentAnswer.ParentAnswerId == null &&
                 !answer.ParentAnswer.IsDeleted && !answer.ParentAnswer.IsHiddenByModerator)));

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
        PublicAnswers(topicId)
            .Include(answer => answer.Author)
            .Include(answer => answer.ParentAnswer)
                .ThenInclude(parent => parent!.Author)
            .SingleOrDefaultAsync(answer =>
                answer.Id == answerId,
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
