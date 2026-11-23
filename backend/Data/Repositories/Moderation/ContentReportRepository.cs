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
        // One UPDATE with the condition in it, so two reports that arrive together hide the content only once.
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

    public async Task KeepHiddenByModeratorAsync(Guid? topicId, Guid? answerId, CancellationToken cancellationToken)
    {
        if (topicId.HasValue)
        {
            await dbContext.Topics.Where(topic => topic.Id == topicId && topic.AutoHiddenAtUtc != null)
                .ExecuteUpdateAsync(set => set.SetProperty(topic => topic.AutoHiddenAtUtc, (DateTimeOffset?)null), cancellationToken);
        }
        else
        {
            await dbContext.Answers.Where(answer => answer.Id == answerId && answer.AutoHiddenAtUtc != null)
                .ExecuteUpdateAsync(set => set.SetProperty(answer => answer.AutoHiddenAtUtc, (DateTimeOffset?)null), cancellationToken);
        }
    }

    public async Task<ContentReportPage> GetPageAsync(
        ReportStatus? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = DetailedQuery().AsNoTracking();
        if (status.HasValue)
        {
            query = query.Where(item => item.Status == status.Value);
        }

        var totalItems = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(item => item.Status == ReportStatus.Pending ? 0 : 1)
            .ThenBy(item => item.CreatedAtUtc)
            .ThenBy(item => item.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return new ContentReportPage(items, totalItems);
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
        Guid id,
        ReportStatus status,
        string administratorId,
        DateTimeOffset resolvedAtUtc,
        string resolutionNote,
        Notification notification,
        AdminAuditLog auditLog,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var affectedRows = await dbContext.ContentReports
            .Where(item => item.Id == id && item.Status == ReportStatus.Pending)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.Status, status)
                .SetProperty(item => item.ResolvedById, administratorId)
                .SetProperty(item => item.ResolvedAtUtc, resolvedAtUtc)
                .SetProperty(item => item.ResolutionNote, resolutionNote),
                cancellationToken);
        if (affectedRows != 1)
        {
            return false;
        }
        dbContext.Notifications.Add(notification);
        dbContext.AdminAuditLogs.Add(auditLog);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }
}
