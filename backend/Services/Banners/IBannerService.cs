using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IBannerService
{
    Task<IReadOnlyList<BannerDto>> GetShownAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<AdminBannerDto>> GetAdminAsync(CancellationToken cancellationToken);

    Task<BannerWriteResult> CreateAsync(string administratorId, SaveBannerRequest request, CancellationToken cancellationToken);

    Task<BannerWriteResult> UpdateAsync(string administratorId, Guid id, SaveBannerRequest request, CancellationToken cancellationToken);

    Task<BannerWriteResult> SetActiveAsync(string administratorId, Guid id, bool isActive, CancellationToken cancellationToken);

    Task<BannerWriteResult> DeleteAsync(string administratorId, Guid id, CancellationToken cancellationToken);

    Task<BannerImageResult> UploadImageAsync(IFormFile file, CancellationToken cancellationToken);
}
