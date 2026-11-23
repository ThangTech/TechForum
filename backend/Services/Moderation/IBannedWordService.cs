using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IBannedWordService
{
    Task<IReadOnlyList<BannedWordDto>> GetAllAsync(CancellationToken cancellationToken);

    Task<Result<BannedWordDto>> AddAsync(string administratorId, SaveBannedWordRequest request, CancellationToken cancellationToken);

    Task<Result> RemoveAsync(string administratorId, Guid id, CancellationToken cancellationToken);
}
