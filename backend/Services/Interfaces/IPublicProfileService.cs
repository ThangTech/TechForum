using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IPublicProfileService
{
    Task<PublicProfileDto?> GetByUserIdAsync(string userId, string? viewerId, CancellationToken cancellationToken);
}
