using TechForum.Api.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class DraftRepository : IDraftRepository
{
    private readonly TechForumDbContext dbContext;

    public DraftRepository(TechForumDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    public Task<Draft?> GetForTargetAsync(string userId, Guid? topicId, CancellationToken cancellationToken)
    {
        return dbContext.Drafts.SingleOrDefaultAsync(
            draft => draft.UserId == userId && draft.TopicId == topicId,
            cancellationToken);
    }

    public Task<bool> OwnsTopicAsync(string userId, Guid topicId, CancellationToken cancellationToken)
    {
        return dbContext.Topics.AnyAsync(
            topic => topic.Id == topicId && topic.AuthorId == userId && !topic.IsDeleted,
            cancellationToken);
    }

    public async Task<bool> TryAddAsync(Draft draft, CancellationToken cancellationToken)
    {
        dbContext.Drafts.Add(draft);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException exception)
            when (SqlErrors.IsDuplicateKey(exception))
        {
            dbContext.Entry(draft).State = EntityState.Detached;
            return false;
        }
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteForTargetAsync(string userId, Guid? topicId, CancellationToken cancellationToken)
    {
        await dbContext.Drafts
            .Where(draft => draft.UserId == userId && draft.TopicId == topicId)
            .ExecuteDeleteAsync(cancellationToken);
    }
}
