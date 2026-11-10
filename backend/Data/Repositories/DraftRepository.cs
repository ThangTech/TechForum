using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class DraftRepository(TechForumDbContext dbContext) : IDraftRepository
{
    public Task<Draft?> GetForTargetAsync(string userId, Guid? topicId, CancellationToken cancellationToken) =>
        dbContext.Drafts.SingleOrDefaultAsync(
            draft => draft.UserId == userId && draft.TopicId == topicId,
            cancellationToken);

    public Task<bool> OwnsTopicAsync(string userId, Guid topicId, CancellationToken cancellationToken) =>
        dbContext.Topics.AnyAsync(
            topic => topic.Id == topicId && topic.AuthorId == userId && !topic.IsDeleted,
            cancellationToken);

    public async Task<bool> TryAddAsync(Draft draft, CancellationToken cancellationToken)
    {
        dbContext.Drafts.Add(draft);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            dbContext.Entry(draft).State = EntityState.Detached;
            return false;
        }
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        dbContext.SaveChangesAsync(cancellationToken);

    public async Task DeleteForTargetAsync(string userId, Guid? topicId, CancellationToken cancellationToken) =>
        await dbContext.Drafts
            .Where(draft => draft.UserId == userId && draft.TopicId == topicId)
            .ExecuteDeleteAsync(cancellationToken);
}
