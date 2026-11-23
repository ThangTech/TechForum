using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IBannedWordRepository
{
    Task<IReadOnlyList<BannedWord>> GetAllAsync(CancellationToken cancellationToken);

    Task<bool> AnyAsync(CancellationToken cancellationToken);

    // Từ đã có thì không tính là lỗi.
    Task AddRangeAsync(IReadOnlyList<BannedWord> words, CancellationToken cancellationToken);

    Task<BannedWord?> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    // False khi từ đã có (kể cả khi yêu cầu khác vừa thêm).
    Task<bool> AddAsync(BannedWord word, CancellationToken cancellationToken);

    Task RemoveAsync(BannedWord word, CancellationToken cancellationToken);
}
