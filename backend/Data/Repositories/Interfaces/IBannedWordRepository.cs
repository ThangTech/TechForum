using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IBannedWordRepository
{
    Task<IReadOnlyList<BannedWord>> GetAllAsync(CancellationToken cancellationToken);

    Task<bool> AnyAsync(CancellationToken cancellationToken);

    // Adds many words at once (the first list). A word that is already there is not an error.
    Task AddRangeAsync(IReadOnlyList<BannedWord> words, CancellationToken cancellationToken);

    Task<BannedWord?> GetByIdAsync(int id, CancellationToken cancellationToken);

    // False when the word is already in the list (also when another request added it a moment before).
    Task<bool> AddAsync(BannedWord word, CancellationToken cancellationToken);

    Task RemoveAsync(BannedWord word, CancellationToken cancellationToken);
}
