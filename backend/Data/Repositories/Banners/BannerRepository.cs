using Microsoft.EntityFrameworkCore;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class BannerRepository(TechForumDbContext dbContext) : IBannerRepository
{
    public async Task<IReadOnlyList<Banner>> GetShownAsync(DateTimeOffset now, CancellationToken cancellationToken) =>
        await dbContext.Banners
            .AsNoTracking()
            .Where(banner =>
                banner.IsActive &&
                (banner.StartsAtUtc == null || banner.StartsAtUtc <= now) &&
                (banner.EndsAtUtc == null || banner.EndsAtUtc > now))
            .OrderBy(banner => banner.DisplayOrder)
            .ThenBy(banner => banner.Id)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Banner>> GetAllAsync(CancellationToken cancellationToken) =>
        await dbContext.Banners
            .AsNoTracking()
            .OrderBy(banner => banner.DisplayOrder)
            .ThenBy(banner => banner.Id)
            .ToListAsync(cancellationToken);

    public Task<Banner?> GetTrackedByIdAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.Banners.SingleOrDefaultAsync(banner => banner.Id == id, cancellationToken);

    public Task<bool> ImageUrlInUseAsync(string imageUrl, Guid exceptId, CancellationToken cancellationToken) =>
        dbContext.Banners.AnyAsync(banner => banner.ImageUrl == imageUrl && banner.Id != exceptId, cancellationToken);

    public async Task AddAsync(Banner banner, CancellationToken cancellationToken)
    {
        dbContext.Banners.Add(banner);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        dbContext.SaveChangesAsync(cancellationToken);

    public async Task RemoveAsync(Banner banner, CancellationToken cancellationToken)
    {
        dbContext.Banners.Remove(banner);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
