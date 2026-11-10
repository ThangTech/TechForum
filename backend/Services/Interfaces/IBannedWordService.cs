using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

// What an administrator does with the list of banned words.
public interface IBannedWordService
{
    Task<IReadOnlyList<BannedWordDto>> GetAllAsync(CancellationToken cancellationToken);

    Task<BannedWordWriteResult> AddAsync(string administratorId, SaveBannedWordRequest request, CancellationToken cancellationToken);

    Task<BannedWordWriteResult> RemoveAsync(string administratorId, Guid id, CancellationToken cancellationToken);
}
