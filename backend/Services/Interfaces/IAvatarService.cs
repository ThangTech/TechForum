using TechForum.Api.Dtos.Auth;

namespace TechForum.Api.Services;

public interface IAvatarService
{
    Task<AvatarUpdateResult> UpdateAsync(string userId, IFormFile file, CancellationToken cancellationToken);

    Task<AvatarUpdateResult> DeleteAsync(string userId, CancellationToken cancellationToken);
}
