using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ITagService
{
    Task<IReadOnlyList<TagDto>> GetActiveAsync(CancellationToken cancellationToken);

    Task<TagDto?> GetActiveByIdAsync(int id, CancellationToken cancellationToken);
    Task<IReadOnlyList<AdminTagDto>> GetAdminAsync(CancellationToken cancellationToken);
    Task<TagWriteResult> CreateAsync(SaveTagRequest request, CancellationToken cancellationToken);
    Task<TagWriteResult> UpdateAsync(int id, SaveTagRequest request, CancellationToken cancellationToken);
    Task<TagWriteResult> SetActiveAsync(int id, bool isActive, CancellationToken cancellationToken);
}
