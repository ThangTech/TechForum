using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class ContentReportRepository(TechForumDbContext dbContext) : IContentReportRepository
{
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
}
