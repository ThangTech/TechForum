using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class ContentReportRepository(TechForumDbContext dbContext) : IContentReportRepository
{
    private IQueryable<ContentReport> DetailedQuery() =>
        dbContext.ContentReports
            .Include(item => item.Topic)
            .Include(item => item.Answer).ThenInclude(answer => answer!.Topic)
            .Include(item => item.Reporter)
            .Include(item => item.ResolvedBy);

    public Task<Answer?> GetPublicAnswerAsync(int answerId, CancellationToken cancellationToken) =>
        dbContext.Answers.AsNoTracking().Include(item => item.Topic).SingleOrDefaultAsync(item =>
            item.Id == answerId &&
            !item.IsDeleted &&
            !item.IsHiddenByModerator &&
            item.Topic.Status == TopicStatus.Published &&
            item.Topic.PublishedAtUtc != null &&
            !item.Topic.IsDeleted &&
            !item.Topic.IsHiddenByModerator,
            cancellationToken);

    public Task<bool> PendingExistsAsync(
        string reporterId,
        int? topicId,
        int? answerId,
        CancellationToken cancellationToken) =>
        dbContext.ContentReports.AnyAsync(item =>
            item.ReporterId == reporterId &&
            item.TopicId == topicId &&
            item.AnswerId == answerId &&
            item.Status == ReportStatus.Pending,
            cancellationToken);

    public async Task<bool> AddAsync(ContentReport report, CancellationToken cancellationToken)
    {
        dbContext.ContentReports.Add(report);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            dbContext.Entry(report).State = EntityState.Detached;
            return false;
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

    public Task<ContentReport?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        DetailedQuery().AsNoTracking().SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

    public async Task<bool> ResolvePendingAsync(
        int id,
        ReportStatus status,
        string administratorId,
        DateTimeOffset resolvedAtUtc,
        string resolutionNote,
        CancellationToken cancellationToken)
    {
        var affectedRows = await dbContext.ContentReports
            .Where(item => item.Id == id && item.Status == ReportStatus.Pending)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.Status, status)
                .SetProperty(item => item.ResolvedById, administratorId)
                .SetProperty(item => item.ResolvedAtUtc, resolvedAtUtc)
                .SetProperty(item => item.ResolutionNote, resolutionNote),
                cancellationToken);
        return affectedRows == 1;
    }
}
