using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class TagRepository(TechForumDbContext dbContext) : ITagRepository
{
    public async Task<IReadOnlyList<Tag>> GetActiveAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Tags
            .AsNoTracking()
            .Where(tag => tag.IsActive)
            .OrderBy(tag => tag.Name)
            .ThenBy(tag => tag.Id)
            .ToListAsync(cancellationToken);
    }

    public Task<Tag?> GetActiveByIdAsync(int id, CancellationToken cancellationToken)
    {
        return dbContext.Tags
            .AsNoTracking()
            .SingleOrDefaultAsync(tag => tag.Id == id && tag.IsActive, cancellationToken);
    }

    public async Task<IReadOnlyList<TagAdminData>> GetAdminAsync(CancellationToken cancellationToken) =>
        await dbContext.Tags
            .AsNoTracking()
            .OrderBy(tag => tag.Name)
            .ThenBy(tag => tag.Id)
            .Select(tag => new TagAdminData(
                tag,
                dbContext.TopicTags.Count(topicTag => topicTag.TagId == tag.Id)))
            .ToListAsync(cancellationToken);

    public Task<Tag?> GetTrackedByIdAsync(int id, CancellationToken cancellationToken) =>
        dbContext.Tags.SingleOrDefaultAsync(tag => tag.Id == id, cancellationToken);

    public Task<int> GetTopicCountAsync(int id, CancellationToken cancellationToken) =>
        dbContext.TopicTags.CountAsync(topicTag => topicTag.TagId == id, cancellationToken);

    public Task<bool> SlugExistsAsync(string slug, int? exceptId, CancellationToken cancellationToken) =>
        dbContext.Tags.AnyAsync(
            tag => tag.Slug == slug && (!exceptId.HasValue || tag.Id != exceptId.Value),
            cancellationToken);

    public async Task<bool> AddAsync(Tag tag, CancellationToken cancellationToken)
    {
        dbContext.Tags.Add(tag);
        return await TrySaveAsync(tag, cancellationToken);
    }

    public Task<bool> SaveChangesAsync(CancellationToken cancellationToken) =>
        TrySaveAsync(null, cancellationToken);

    private async Task<bool> TrySaveAsync(Tag? addedTag, CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            if (addedTag is not null) dbContext.Entry(addedTag).State = EntityState.Detached;
            return false;
        }
    }
}
