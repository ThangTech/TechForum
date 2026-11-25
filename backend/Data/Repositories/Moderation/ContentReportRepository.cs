using TechForum.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class ContentReportRepository : IContentReportRepository
{
    private readonly TechForumDbContext dbContext;

    public ContentReportRepository(TechForumDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    private IQueryable<ContentReport> DetailedQuery()
    {
        return dbContext.ContentReports
            .Include(item => item.Topic).ThenInclude(topic => topic!.Author)
            .Include(item => item.Answer).ThenInclude(answer => answer!.Topic)
            .Include(item => item.Answer).ThenInclude(answer => answer!.Author)
            .Include(item => item.Answer).ThenInclude(answer => answer!.ParentAnswer)
            .Include(item => item.Reporter)
            .Include(item => item.ResolvedBy);
    }

    public Task<Answer?> GetPublicAnswerAsync(Guid answerId, CancellationToken cancellationToken)
    {
        return dbContext.Answers.AsNoTracking().Include(item => item.Topic)
            .Where(AnswerVisibility.IsPublic)
            .WhereTopicIsPublic(item => item.Topic)
            .SingleOrDefaultAsync(item => item.Id == answerId, cancellationToken);
    }

    public Task<bool> PendingExistsAsync(
        string reporterId,
        Guid? topicId,
        Guid? answerId,
        CancellationToken cancellationToken)
    {
        return dbContext.ContentReports.AnyAsync(item =>
            item.ReporterId == reporterId &&
            item.TopicId == topicId &&
            item.AnswerId == answerId &&
            item.Status == ReportStatus.Pending,
            cancellationToken);
    }

    public async Task<bool> AddAsync(ContentReport report, CancellationToken cancellationToken)
    {
        dbContext.ContentReports.Add(report);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException exception)
            when (SqlErrors.IsDuplicateKey(exception))
        {
            dbContext.Entry(report).State = EntityState.Detached;
            return false;
        }
    }

    public Task<int> CountPendingReportersAsync(
        Guid? topicId, Guid? answerId, DateTimeOffset accountsCreatedBefore, CancellationToken cancellationToken)
    {
        return dbContext.ContentReports
            .Where(item => item.TopicId == topicId && item.AnswerId == answerId &&
                item.Status == ReportStatus.Pending && item.Reporter.CreatedAtUtc <= accountsCreatedBefore)
            .Select(item => item.ReporterId)
            .Distinct()
            .CountAsync(cancellationToken);
    }

    public Task<bool> HasAcceptedReportAsync(Guid? topicId, Guid? answerId, CancellationToken cancellationToken)
    {
        return dbContext.ContentReports.AnyAsync(item => item.TopicId == topicId && item.AnswerId == answerId &&
            item.Status == ReportStatus.Accepted, cancellationToken);
    }

    public async Task<bool> AutoHideAsync(
        Guid? topicId, Guid? answerId, DateTimeOffset now, Notification notification, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        // Điều kiện nằm trong câu UPDATE, nên hai báo cáo tới cùng lúc chỉ ẩn nội dung một lần.
        var affected = topicId.HasValue
            ? await dbContext.Topics
                .Where(topic => topic.Id == topicId && !topic.IsHiddenByModerator && !topic.IsDeleted)
                .ExecuteUpdateAsync(set => set
                    .SetProperty(topic => topic.IsHiddenByModerator, true)
                    .SetProperty(topic => topic.AutoHiddenAtUtc, now), cancellationToken)
            : await dbContext.Answers
                .Where(answer => answer.Id == answerId && !answer.IsHiddenByModerator && !answer.IsDeleted)
                .ExecuteUpdateAsync(set => set
                    .SetProperty(answer => answer.IsHiddenByModerator, true)
                    .SetProperty(answer => answer.AutoHiddenAtUtc, now), cancellationToken);
        if (affected != 1)
        {
            return false;
        }

        dbContext.Notifications.Add(notification);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ShowAutoHiddenAsync(
        Guid? topicId, Guid? answerId, Notification notification, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var affected = topicId.HasValue
            ? await dbContext.Topics
                .Where(topic => topic.Id == topicId && topic.AutoHiddenAtUtc != null)
                .ExecuteUpdateAsync(set => set
                    .SetProperty(topic => topic.IsHiddenByModerator, false)
                    .SetProperty(topic => topic.AutoHiddenAtUtc, (DateTimeOffset?)null), cancellationToken)
            : await dbContext.Answers
                .Where(answer => answer.Id == answerId && answer.AutoHiddenAtUtc != null)
                .ExecuteUpdateAsync(set => set
                    .SetProperty(answer => answer.IsHiddenByModerator, false)
                    .SetProperty(answer => answer.AutoHiddenAtUtc, (DateTimeOffset?)null), cancellationToken);
        if (affected != 1)
        {
            return false;
        }

        dbContext.Notifications.Add(notification);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    public async Task<ContentReportPage> GetPageAsync(
        ReportFilter filter,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = DetailedQuery().AsNoTracking();
        if (filter.Status.HasValue)
        {
            query = query.Where(item => item.Status == filter.Status.Value);
        }
        if (filter.IsAnswer == true)
        {
            query = query.Where(item => item.AnswerId != null);
        }
        else if (filter.IsAnswer == false)
        {
            query = query.Where(item => item.TopicId != null);
        }
        if (!string.IsNullOrEmpty(filter.Reason))
        {
            query = query.Where(item => item.Reason == filter.Reason);
        }
        if (filter.Status == ReportStatus.Pending)
        {
            // Mỗi nội dung một dòng: bỏ các báo cáo đang chờ đến sau báo cáo đầu tiên về cùng nội dung.
            query = query.Where(item => !dbContext.ContentReports.Any(other =>
                other.Status == ReportStatus.Pending && other.TopicId == item.TopicId && other.AnswerId == item.AnswerId &&
                other.CreatedAtUtc < item.CreatedAtUtc));
        }

        var totalItems = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(item => item.Status == ReportStatus.Pending ? 0 : 1)
            .ThenBy(item => item.CreatedAtUtc)
            .ThenBy(item => item.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return new ContentReportPage(items, totalItems, await SummarizeAsync(items, cancellationToken));
    }

    // Số báo cáo đang chờ và lý do cho từng nội dung có trong trang.
    private async Task<IReadOnlyDictionary<Guid, ReportTargetSummary>> SummarizeAsync(
        IReadOnlyList<ContentReport> items, CancellationToken cancellationToken)
    {
        var topicIds = items.Where(item => item.TopicId.HasValue).Select(item => item.TopicId!.Value).ToList();
        var answerIds = items.Where(item => item.AnswerId.HasValue).Select(item => item.AnswerId!.Value).ToList();
        var pending = await dbContext.ContentReports.AsNoTracking()
            .Where(item => item.Status == ReportStatus.Pending &&
                ((item.TopicId != null && topicIds.Contains(item.TopicId.Value)) ||
                 (item.AnswerId != null && answerIds.Contains(item.AnswerId.Value))))
            .Select(item => new { item.TopicId, item.AnswerId, item.Reason })
            .ToListAsync(cancellationToken);

        var summaries = new Dictionary<Guid, ReportTargetSummary>();
        foreach (var item in items)
        {
            var same = pending.Where(other => other.TopicId == item.TopicId && other.AnswerId == item.AnswerId).ToList();
            summaries[item.Id] = new ReportTargetSummary(same.Count, same.Select(other => other.Reason).Distinct().ToList());
        }
        return summaries;
    }

    public async Task<IReadOnlyList<PendingReport>> GetPendingForTargetAsync(
        Guid? topicId, Guid? answerId, CancellationToken cancellationToken)
    {
        return await dbContext.ContentReports.AsNoTracking()
            .Where(item => item.TopicId == topicId && item.AnswerId == answerId && item.Status == ReportStatus.Pending)
            .Select(item => new PendingReport(item.Id, item.ReporterId))
            .ToListAsync(cancellationToken);
    }

    public Task<ContentReport?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return DetailedQuery().AsNoTracking().SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
    }

    public async Task<ContentReportPage> GetMineAsync(string reporterId, ReportStatus? status,
        int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = dbContext.ContentReports.AsNoTracking().Where(item => item.ReporterId == reporterId);
        if (status.HasValue)
        {
            query = query.Where(item => item.Status == status.Value);
        }
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(item => item.CreatedAtUtc).ThenByDescending(item => item.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Include(item => item.Topic)
            .Include(item => item.Answer).ThenInclude(answer => answer!.Topic)
            .Include(item => item.Answer).ThenInclude(answer => answer!.ParentAnswer)
            .ToListAsync(cancellationToken);
        return new ContentReportPage(items, total);
    }

    public async Task<bool> ResolvePendingAsync(
        IReadOnlyCollection<Guid> ids,
        ReportStatus status,
        string administratorId,
        DateTimeOffset resolvedAtUtc,
        string resolutionNote,
        Guid? topicId,
        Guid? answerId,
        bool hideTarget,
        IReadOnlyList<Notification> notifications,
        IReadOnlyList<AdminAuditLog> auditLogs,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var affectedRows = await dbContext.ContentReports
            .Where(item => ids.Contains(item.Id) && item.Status == ReportStatus.Pending)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.Status, status)
                .SetProperty(item => item.ResolvedById, administratorId)
                .SetProperty(item => item.ResolvedAtUtc, resolvedAtUtc)
                .SetProperty(item => item.ResolutionNote, resolutionNote),
                cancellationToken);
        // Có báo cáo vừa được quản trị viên khác xử lý: huỷ cả giao dịch để không thông báo hai lần.
        if (affectedRows != ids.Count)
        {
            return false;
        }

        if (hideTarget && topicId.HasValue)
        {
            await dbContext.Topics.Where(topic => topic.Id == topicId && !topic.IsDeleted)
                .ExecuteUpdateAsync(set => set
                    .SetProperty(topic => topic.IsHiddenByModerator, true)
                    .SetProperty(topic => topic.AutoHiddenAtUtc, (DateTimeOffset?)null), cancellationToken);
        }
        else if (hideTarget && answerId.HasValue)
        {
            await dbContext.Answers.Where(answer => answer.Id == answerId && !answer.IsDeleted)
                .ExecuteUpdateAsync(set => set
                    .SetProperty(answer => answer.IsHiddenByModerator, true)
                    .SetProperty(answer => answer.AutoHiddenAtUtc, (DateTimeOffset?)null), cancellationToken);
        }

        dbContext.Notifications.AddRange(notifications);
        dbContext.AdminAuditLogs.AddRange(auditLogs);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }
}
