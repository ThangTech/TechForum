using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ITagService
{
    Task<IReadOnlyList<TagDto>> GetActiveAsync(CancellationToken cancellationToken);

    Task<TagDto?> GetActiveByIdAsync(int id, CancellationToken cancellationToken);
    Task<IReadOnlyList<AdminTagDto>> GetAdminAsync(CancellationToken cancellationToken);
    Task<TagWriteResult> CreateAsync(string administratorId, SaveTagRequest request, CancellationToken cancellationToken);
    Task<TagWriteResult> UpdateAsync(string administratorId, int id, SaveTagRequest request, CancellationToken cancellationToken);
    Task<TagWriteResult> SetActiveAsync(string administratorId, int id, bool isActive, CancellationToken cancellationToken);
}
