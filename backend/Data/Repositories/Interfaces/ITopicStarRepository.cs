namespace TechForum.Api.Data.Repositories;

public interface ITopicStarRepository
{
    Task<int> CountAsync(int topicId, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int topicId, string userId, CancellationToken cancellationToken);
    Task AddAsync(int topicId, string userId, DateTimeOffset createdAtUtc, CancellationToken cancellationToken);
    Task RemoveAsync(int topicId, string userId, CancellationToken cancellationToken);

    // The topics the member gave a star, the newest star first; only topics everyone can still read.
    Task<StarPage> GetPageAsync(string userId, int page, int pageSize, CancellationToken cancellationToken);
}
