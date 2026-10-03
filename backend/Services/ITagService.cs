using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ITagService
{
    Task<IReadOnlyList<TagDto>> GetActiveAsync(CancellationToken cancellationToken);

    Task<TagDto?> GetActiveByIdAsync(int id, CancellationToken cancellationToken);
}
