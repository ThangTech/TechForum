using TechForum.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TechForum.Api.Enums;
using TechForum.Api.Models;
using TechForum.Api.Services;

namespace TechForum.Api.Data.Repositories;

public sealed class AnswerRepository : IAnswerRepository
{
    private readonly TechForumDbContext dbContext;
    private readonly TimeProvider timeProvider;

    public AnswerRepository(TechForumDbContext dbContext, TimeProvider timeProvider)
    {
        this.dbContext = dbContext;
        this.timeProvider = timeProvider;
    }

    public async Task<AnswerPage?> GetPublicPageAsync(
        Guid topicId,
        int page,
        int pageSize,
        Guid? aroundAnswerId,
        string sort,
        CancellationToken cancellationToken)
    {
        var answers = PublicAnswers(topicId);
        // Điểm của câu trả lời mới bị ẩn, nên khi sắp theo điểm nó tính là 0 (thứ tự không được làm lộ điểm).
        var hiddenSince = timeProvider.GetUtcNow().AddHours(-ReputationRules.ScoreHiddenHours);

        // Câu trả lời được chấp nhận luôn đứng đầu. Guid rỗng nghĩa là chưa có, nên phép so sánh không bao giờ khớp.
        var pinnedId = await GetPinnedAnswerIdAsync(topicId, answers, cancellationToken);
        var hasPinned = pinnedId != Guid.Empty;
        var unpinned = answers.Where(answer => answer.Id != pinnedId);

        if (aroundAnswerId.HasValue)
        {
            var target = await answers
                .Where(answer => answer.Id == aroundAnswerId.Value)
                .Select(answer => new { answer.Id, answer.CreatedAtUtc, HelpfulCount = answer.HelpfulVotes.Count, Score = answer.CreatedAtUtc <= hiddenSince ? answer.Score : 0 })
                .SingleOrDefaultAsync(cancellationToken);
            if (target is null)
            {
                return null;
            }

            // Dùng đúng thứ tự của danh sách để tìm trang, không tải các trang trước đó.
            // The pinned answer is before all the others; if it is the one that is looked for, it is the first.
            var precedingCount = target.Id == pinnedId ? 0 : (hasPinned ? 1 : 0) + (sort == "score"
                ? await unpinned.CountAsync(answer =>
                    (answer.CreatedAtUtc <= hiddenSince ? answer.Score : 0) > target.Score ||
                    ((answer.CreatedAtUtc <= hiddenSince ? answer.Score : 0) == target.Score &&
                        (answer.CreatedAtUtc < target.CreatedAtUtc ||
                        (answer.CreatedAtUtc == target.CreatedAtUtc && answer.Id < target.Id))),
                    cancellationToken)
                : sort == "helpful"
                ? await unpinned.CountAsync(answer =>
                    answer.HelpfulVotes.Count > target.HelpfulCount ||
                    (answer.HelpfulVotes.Count == target.HelpfulCount &&
                        (answer.CreatedAtUtc < target.CreatedAtUtc ||
                        (answer.CreatedAtUtc == target.CreatedAtUtc && answer.Id < target.Id))),
                    cancellationToken)
                : await unpinned.CountAsync(answer =>
                    answer.CreatedAtUtc < target.CreatedAtUtc ||
                    (answer.CreatedAtUtc == target.CreatedAtUtc && answer.Id < target.Id),
                    cancellationToken));
            page = precedingCount / pageSize + 1;
        }

        var totalItems = await answers.CountAsync(cancellationToken);
        var pinnedFirst = answers.OrderByDescending(answer => answer.Id == pinnedId);
        IOrderedQueryable<Answer> orderedAnswers;
        if (sort == "score")
        {
            // Điểm của câu trả lời còn mới bị ẩn, nên chưa được tính khi sắp xếp.
            orderedAnswers = pinnedFirst.ThenByDescending(answer => answer.CreatedAtUtc <= hiddenSince ? answer.Score : 0);
        }
        else if (sort == "helpful")
        {
            orderedAnswers = pinnedFirst.ThenByDescending(answer => answer.HelpfulVotes.Count);
        }
        else
        {
            orderedAnswers = pinnedFirst;
        }
        orderedAnswers = orderedAnswers.ThenBy(answer => answer.CreatedAtUtc).ThenBy(answer => answer.Id);
        var items = await orderedAnswers
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(answer => answer.Author)
            .Include(answer => answer.ParentAnswer)
                .ThenInclude(parent => parent!.Author)
            .ToListAsync(cancellationToken);

        return new AnswerPage(items, totalItems, page);
    }

    // Bài viết (article) không có câu trả lời được chấp nhận; câu trả lời đã xóa hoặc bị ẩn thì không được ghim.
    private async Task<Guid> GetPinnedAnswerIdAsync(
        Guid topicId,
        IQueryable<Answer> visibleAnswers,
        CancellationToken cancellationToken)
    {
        var acceptedId = await dbContext.Topics.AsNoTracking()
            .Where(topic => topic.Id == topicId && topic.Type == TopicType.Question)
            .Select(topic => topic.AcceptedAnswerId)
            .SingleOrDefaultAsync(cancellationToken);
        if (acceptedId is null) return Guid.Empty;
        return await visibleAnswers.AnyAsync(answer => answer.Id == acceptedId.Value, cancellationToken) ? acceptedId.Value : Guid.Empty;
    }

    // Chỉ dùng cho điểm thưởng của câu trả lời được chấp nhận; phiếu bình chọn đổi danh tiếng trong giao dịch riêng (VoteRepository).
    public async Task AdjustReputationAsync(string userId, int delta, CancellationToken cancellationToken)
    {
        await dbContext.Users.Where(user => user.Id == userId)
            .ExecuteUpdateAsync(set => set.SetProperty(user => user.Reputation, user => user.Reputation + delta), cancellationToken);
    }

    public async Task<IReadOnlyList<AnswerHelpfulState>> GetHelpfulStatesAsync(
        IReadOnlyCollection<Guid> answerIds,
        string? viewerId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Answers.AsNoTracking()
            .Where(answer => answerIds.Contains(answer.Id))
            .Select(answer => new AnswerHelpfulState(
                answer.Id,
                answer.HelpfulVotes.Count,
                viewerId != null && answer.HelpfulVotes.Any(vote => vote.UserId == viewerId),
                answer.Score,
                viewerId == null
                    ? 0
                    : dbContext.UserVotes
                        .Where(vote => vote.UserId == viewerId && vote.TargetType == VoteTargetType.Answer && vote.TargetId == answer.Id)
                        .Select(vote => vote.Value)
                        .FirstOrDefault()))
            .ToListAsync(cancellationToken);
    }

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
            when (SqlErrors.IsDuplicateKey(exception))
        {
            // Hai lần bấm đồng thời vẫn chỉ tạo một lượt bình chọn.
            dbContext.Entry(vote).State = EntityState.Detached;
        }
    }

    public async Task RemoveHelpfulAsync(Guid answerId, string userId, CancellationToken cancellationToken)
    {
        await dbContext.AnswerHelpfulVotes
            .Where(vote => vote.AnswerId == answerId && vote.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);
    }

    private IQueryable<Answer> PublicAnswers(Guid topicId)
    {
        return dbContext.Answers.AsNoTracking()
            .Where(answer => answer.TopicId == topicId)
            .Where(AnswerVisibility.IsPublic);
    }

    public async Task AddAsync(Answer answer, CancellationToken cancellationToken)
    {
        dbContext.Answers.Add(answer);
        await dbContext.SaveChangesAsync(cancellationToken);
        await dbContext.Entry(answer).Reference(item => item.Author).LoadAsync(cancellationToken);
    }

    public Task<Answer?> GetVisibleByIdAsync(
        Guid topicId,
        Guid answerId,
        CancellationToken cancellationToken)
    {
        return PublicAnswers(topicId)
            .Include(answer => answer.Author)
            .Include(answer => answer.ParentAnswer)
                .ThenInclude(parent => parent!.Author)
            .SingleOrDefaultAsync(answer =>
                answer.Id == answerId,
                cancellationToken);
    }

    public Task<Answer?> GetOwnedByIdAsync(
        Guid topicId,
        Guid answerId,
        string authorId,
        CancellationToken cancellationToken)
    {
        return dbContext.Answers
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
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
