using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IBannerService
{
    Task<IReadOnlyList<BannerDto>> GetShownAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<AdminBannerDto>> GetAdminAsync(CancellationToken cancellationToken);

    Task<Result<AdminBannerDto>> CreateAsync(string administratorId, SaveBannerRequest request, CancellationToken cancellationToken);

    Task<Result<AdminBannerDto>> UpdateAsync(string administratorId, Guid id, SaveBannerRequest request, CancellationToken cancellationToken);

    Task<Result<AdminBannerDto>> SetActiveAsync(string administratorId, Guid id, bool isActive, CancellationToken cancellationToken);

    Task<Result> DeleteAsync(string administratorId, Guid id, CancellationToken cancellationToken);

    Task<Result<string>> UploadImageAsync(IFormFile file, CancellationToken cancellationToken);
}
