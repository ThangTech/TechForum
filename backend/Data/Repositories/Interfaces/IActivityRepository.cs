namespace TechForum.Api.Data.Repositories;

public interface IActivityRepository
{
    Task<ActivityPage> GetPublicActivityAsync(
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}
