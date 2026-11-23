using TechForum.Api.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class BannedWordRepository : IBannedWordRepository
{
    private readonly TechForumDbContext dbContext;

    public BannedWordRepository(TechForumDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    public async Task<IReadOnlyList<BannedWord>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.BannedWords.AsNoTracking().OrderBy(item => item.Word).ToListAsync(cancellationToken);
    }

    public Task<bool> AnyAsync(CancellationToken cancellationToken)
    {
        return dbContext.BannedWords.AnyAsync(cancellationToken);
    }

    public async Task AddRangeAsync(IReadOnlyList<BannedWord> words, CancellationToken cancellationToken)
    {
        dbContext.BannedWords.AddRange(words);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception)
            when (SqlErrors.IsDuplicateKey(exception))
        {
            // Một instance khác của API vừa nạp bảng cùng lúc; danh sách của nó giống hệt.
            dbContext.ChangeTracker.Clear();
        }
    }

    public Task<BannedWord?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return dbContext.BannedWords.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
    }

    public async Task<bool> AddAsync(BannedWord word, CancellationToken cancellationToken)
    {
        dbContext.BannedWords.Add(word);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException exception)
            when (SqlErrors.IsDuplicateKey(exception))
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
