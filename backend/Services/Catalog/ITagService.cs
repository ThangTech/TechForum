using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ITagService
{
    Task<IReadOnlyList<TagDto>> GetActiveAsync(CancellationToken cancellationToken);

    Task<TagDto?> GetActiveByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<AdminTagDto>> GetAdminAsync(CancellationToken cancellationToken);
    Task<TagWriteResult> CreateAsync(string administratorId, SaveTagRequest request, CancellationToken cancellationToken);
    Task<TagWriteResult> UpdateAsync(string administratorId, Guid id, SaveTagRequest request, CancellationToken cancellationToken);
    Task<TagWriteResult> SetActiveAsync(string administratorId, Guid id, bool isActive, CancellationToken cancellationToken);
}
