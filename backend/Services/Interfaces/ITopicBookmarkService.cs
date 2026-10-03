using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ITopicBookmarkService
{
    Task<BookmarkStatusDto?> GetStatusAsync(int topicId, string? userId, CancellationToken cancellationToken);
    Task<BookmarkStatusDto?> AddAsync(int topicId, string userId, CancellationToken cancellationToken);
    Task<BookmarkStatusDto?> RemoveAsync(int topicId, string userId, CancellationToken cancellationToken);
    Task<PagedResultDto<SavedTopicDto>> GetSavedPageAsync(string userId, BookmarkQuery query, CancellationToken cancellationToken);
}
