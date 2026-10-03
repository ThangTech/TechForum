namespace TechForum.Api.Data.Repositories;

public interface ITopicBookmarkRepository
{
    Task<int> CountAsync(int topicId, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int topicId, string userId, CancellationToken cancellationToken);
    Task AddAsync(int topicId, string userId, DateTimeOffset createdAtUtc, CancellationToken cancellationToken);
    Task RemoveAsync(int topicId, string userId, CancellationToken cancellationToken);
    Task<BookmarkPage> GetPageAsync(string userId, int page, int pageSize, CancellationToken cancellationToken);
}
