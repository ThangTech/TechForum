using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ITopicStarService
{
    Task<TopicStarDto?> GetAsync(int topicId, string? userId, CancellationToken cancellationToken);
    Task<TopicStarDto?> AddAsync(int topicId, string userId, CancellationToken cancellationToken);
    Task<TopicStarDto?> RemoveAsync(int topicId, string userId, CancellationToken cancellationToken);
}
