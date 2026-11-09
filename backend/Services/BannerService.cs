using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class BannerService(
    IBannerRepository bannerRepository,
    IBannerImageStorage imageStorage,
    IAdminAuditService auditService,
    TimeProvider timeProvider) : IBannerService
{
    private const int MaxTitleLength = 120;
    private const int MaxLinkLength = 500;
    private const int MaxDisplayOrder = 10_000;

    public async Task<IReadOnlyList<BannerDto>> GetShownAsync(CancellationToken cancellationToken) =>
        (await bannerRepository.GetShownAsync(timeProvider.GetUtcNow(), cancellationToken))
            .Select(banner => new BannerDto(banner.Id, banner.Title, banner.ImageUrl, banner.LinkUrl))
            .ToList();

    public async Task<IReadOnlyList<AdminBannerDto>> GetAdminAsync(CancellationToken cancellationToken) =>
        (await bannerRepository.GetAllAsync(cancellationToken)).Select(MapAdminDto).ToList();

    public async Task<BannerWriteResult> CreateAsync(
        string administratorId,
        SaveBannerRequest request,
        CancellationToken cancellationToken)
    {
        var validation = Validate(request);
        if (validation is not null)
        {
            return validation;
        }

        var banner = new Banner
        {
            Title = request.Title!.Trim(),
            ImageUrl = request.ImageUrl!.Trim(),
            LinkUrl = NormalizeLink(request.LinkUrl),
            DisplayOrder = request.DisplayOrder,
            IsActive = true,
            StartsAtUtc = request.StartsAtUtc,
            EndsAtUtc = request.EndsAtUtc,
            CreatedAtUtc = timeProvider.GetUtcNow()
        };
        await bannerRepository.AddAsync(banner, cancellationToken);
        await auditService.RecordAsync(administratorId, "banner-created", "Banner", banner.Id.ToString(), null,
            Describe(banner), "Tạo banner.", cancellationToken);
        return BannerWriteResult.Success(MapAdminDto(banner));
    }

    public async Task<BannerWriteResult> UpdateAsync(
        string administratorId,
        int id,
        SaveBannerRequest request,
        CancellationToken cancellationToken)
    {
        var validation = Validate(request);
        if (validation is not null)
        {
            return validation;
        }

        var banner = await bannerRepository.GetTrackedByIdAsync(id, cancellationToken);
        if (banner is null)
        {
            return NotFound();
        }

        var previous = Describe(banner);
        var oldImageUrl = banner.ImageUrl;
        banner.Title = request.Title!.Trim();
        banner.ImageUrl = request.ImageUrl!.Trim();
        banner.LinkUrl = NormalizeLink(request.LinkUrl);
        banner.DisplayOrder = request.DisplayOrder;
        banner.StartsAtUtc = request.StartsAtUtc;
        banner.EndsAtUtc = request.EndsAtUtc;
        await bannerRepository.SaveChangesAsync(cancellationToken);
        if (oldImageUrl != banner.ImageUrl)
        {
            await DeleteImageIfUnusedAsync(oldImageUrl, banner.Id, cancellationToken);
        }

        await auditService.RecordAsync(administratorId, "banner-updated", "Banner", banner.Id.ToString(), previous,
            Describe(banner), "Cập nhật banner.", cancellationToken);
        return BannerWriteResult.Success(MapAdminDto(banner));
    }

    public async Task<BannerWriteResult> SetActiveAsync(
        string administratorId,
        int id,
        bool isActive,
        CancellationToken cancellationToken)
    {
        var banner = await bannerRepository.GetTrackedByIdAsync(id, cancellationToken);
        if (banner is null)
        {
            return NotFound();
        }

        var previous = banner.IsActive;
        banner.IsActive = isActive;
        await bannerRepository.SaveChangesAsync(cancellationToken);
        await auditService.RecordAsync(administratorId, isActive ? "banner-activated" : "banner-deactivated", "Banner",
            banner.Id.ToString(), $"active={previous}", $"active={isActive}",
            isActive ? "Bật banner." : "Tắt banner.", cancellationToken);
        return BannerWriteResult.Success(MapAdminDto(banner));
    }

    public async Task<BannerWriteResult> DeleteAsync(string administratorId, int id, CancellationToken cancellationToken)
    {
        var banner = await bannerRepository.GetTrackedByIdAsync(id, cancellationToken);
        if (banner is null)
        {
            return NotFound();
        }

        var dto = MapAdminDto(banner);
        var previous = Describe(banner);
        await bannerRepository.RemoveAsync(banner, cancellationToken);
        await DeleteImageIfUnusedAsync(banner.ImageUrl, banner.Id, cancellationToken);
        await auditService.RecordAsync(administratorId, "banner-deleted", "Banner", id.ToString(), previous, null,
            "Xóa banner.", cancellationToken);
        return BannerWriteResult.Success(dto);
    }

    public Task<BannerImageResult> UploadImageAsync(IFormFile file, CancellationToken cancellationToken) =>
        imageStorage.SaveAsync(file, cancellationToken);

    // Two banners may point to the same picture, so the file is only removed when no other banner uses it.
    private async Task DeleteImageIfUnusedAsync(string imageUrl, int bannerId, CancellationToken cancellationToken)
    {
        if (!await bannerRepository.ImageUrlInUseAsync(imageUrl, bannerId, cancellationToken))
        {
            await imageStorage.DeleteAsync(imageUrl, cancellationToken);
        }
    }

    private BannerWriteResult? Validate(SaveBannerRequest request)
    {
        var title = request.Title?.Trim();
        if (string.IsNullOrWhiteSpace(title) || title.Length > MaxTitleLength)
        {
            return Invalid($"Tiêu đề banner phải có từ 1 đến {MaxTitleLength} ký tự.", "title");
        }

        var imageUrl = request.ImageUrl?.Trim();
        if (string.IsNullOrWhiteSpace(imageUrl) || !imageStorage.IsStoredImageUrl(imageUrl))
        {
            return Invalid("Hãy chọn ảnh banner đã tải lên.", "imageUrl");
        }

        if (!IsValidLink(request.LinkUrl))
        {
            return Invalid("Liên kết phải là đường dẫn trong trang (bắt đầu bằng /) hoặc địa chỉ http/https.", "linkUrl");
        }

        if (request.DisplayOrder is < 0 or > MaxDisplayOrder)
        {
            return Invalid($"Thứ tự hiển thị phải từ 0 đến {MaxDisplayOrder}.", "displayOrder");
        }

        if (request.StartsAtUtc.HasValue && request.EndsAtUtc.HasValue && request.EndsAtUtc <= request.StartsAtUtc)
        {
            return Invalid("Thời điểm kết thúc phải sau thời điểm bắt đầu.", "endsAtUtc");
        }

        return null;
    }

    private static bool IsValidLink(string? link)
    {
        var value = link?.Trim();
        if (string.IsNullOrEmpty(value))
        {
            return true;
        }

        if (value.Length > MaxLinkLength)
        {
            return false;
        }

        if (value.StartsWith('/'))
        {
            // "//host" would send the visitor to another site, so only one leading slash is allowed.
            return !value.StartsWith("//", StringComparison.Ordinal) && !value.Contains('\\');
        }

        return Uri.TryCreate(value, UriKind.Absolute, out var uri) &&
            (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }

    private static string? NormalizeLink(string? link) =>
        string.IsNullOrWhiteSpace(link) ? null : link.Trim();

    private static string Describe(Banner banner) =>
        $"title={banner.Title};order={banner.DisplayOrder};active={banner.IsActive}";

    private static BannerWriteResult Invalid(string message, string field) =>
        BannerWriteResult.Failed(BannerWriteFailure.Validation, message, field);

    private static BannerWriteResult NotFound() =>
        BannerWriteResult.Failed(BannerWriteFailure.NotFound, "Không tìm thấy banner.");

    private static AdminBannerDto MapAdminDto(Banner banner) => new(
        banner.Id,
        banner.Title,
        banner.ImageUrl,
        banner.LinkUrl,
        banner.DisplayOrder,
        banner.IsActive,
        banner.StartsAtUtc,
        banner.EndsAtUtc,
        banner.CreatedAtUtc);
}
