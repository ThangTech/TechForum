namespace TechForum.Api.Data.Repositories;

public interface ITopicStarRepository
{
    Task<int> CountAsync(Guid topicId, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(Guid topicId, string userId, CancellationToken cancellationToken);
    Task AddAsync(Guid topicId, string userId, DateTimeOffset createdAtUtc, CancellationToken cancellationToken);
    Task RemoveAsync(Guid topicId, string userId, CancellationToken cancellationToken);

    // Chỉ các bài mọi người còn đọc được, sao mới nhất trước.
    Task<StarPage> GetPageAsync(string userId, int page, int pageSize, CancellationToken cancellationToken);
}
