using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ITagService
{
    Task<IReadOnlyList<TagDto>> GetActiveAsync(CancellationToken cancellationToken);

    Task<TagDto?> GetActiveByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<AdminTagDto>> GetAdminAsync(CancellationToken cancellationToken);
    Task<Result<AdminTagDto>> CreateAsync(string administratorId, SaveTagRequest request, CancellationToken cancellationToken);
    Task<Result<AdminTagDto>> UpdateAsync(string administratorId, Guid id, SaveTagRequest request, CancellationToken cancellationToken);
    Task<Result<AdminTagDto>> SetActiveAsync(string administratorId, Guid id, bool isActive, CancellationToken cancellationToken);
}
