using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ITopicStarService
{
    Task<TopicStarDto?> GetAsync(Guid topicId, string? userId, CancellationToken cancellationToken);
    Task<TopicStarDto?> AddAsync(Guid topicId, string userId, CancellationToken cancellationToken);
    // The topics the member gave a star ("yêu thích"), the newest star first.
    Task<PagedResultDto<SavedTopicDto>> GetStarredPageAsync(string userId, BookmarkQuery query, CancellationToken cancellationToken);
    Task<TopicStarDto?> RemoveAsync(Guid topicId, string userId, CancellationToken cancellationToken);
}
