namespace TechForum.Api.Data.Repositories;

public interface IPublicProfileRepository
{
    Task<PublicProfileData?> GetByUserIdAsync(string userId, CancellationToken cancellationToken);
}
