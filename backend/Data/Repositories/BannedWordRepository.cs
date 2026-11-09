using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class BannedWordRepository(TechForumDbContext dbContext) : IBannedWordRepository
{
    public async Task<IReadOnlyList<BannedWord>> GetAllAsync(CancellationToken cancellationToken) =>
        await dbContext.BannedWords.AsNoTracking().OrderBy(item => item.Word).ToListAsync(cancellationToken);

    public Task<bool> AnyAsync(CancellationToken cancellationToken) =>
        dbContext.BannedWords.AnyAsync(cancellationToken);

    public async Task AddRangeAsync(IReadOnlyList<BannedWord> words, CancellationToken cancellationToken)
    {
        dbContext.BannedWords.AddRange(words);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            // Another instance of the API filled the table at the same moment; its words are the same list.
            dbContext.ChangeTracker.Clear();
        }
    }

    public Task<BannedWord?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        dbContext.BannedWords.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

    public async Task<bool> AddAsync(BannedWord word, CancellationToken cancellationToken)
    {
        dbContext.BannedWords.Add(word);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            dbContext.Entry(word).State = EntityState.Detached;
            return false;
        }
    }

    public async Task RemoveAsync(BannedWord word, CancellationToken cancellationToken)
    {
        dbContext.BannedWords.Remove(word);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
