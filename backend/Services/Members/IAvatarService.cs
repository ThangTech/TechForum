using TechForum.Api.Dtos.Auth;

namespace TechForum.Api.Services;

public interface IAvatarService
{
    Task<Result<CurrentUserDto>> UpdateAsync(string userId, IFormFile file, CancellationToken cancellationToken);

    Task<Result<CurrentUserDto>> DeleteAsync(string userId, CancellationToken cancellationToken);
}
