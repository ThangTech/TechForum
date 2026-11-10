using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ITopicBookmarkService
{
    Task<BookmarkStatusDto?> GetStatusAsync(Guid topicId, string? userId, CancellationToken cancellationToken);
    Task<BookmarkStatusDto?> AddAsync(Guid topicId, string userId, CancellationToken cancellationToken);
    Task<BookmarkStatusDto?> RemoveAsync(Guid topicId, string userId, CancellationToken cancellationToken);
    Task<PagedResultDto<SavedTopicDto>> GetSavedPageAsync(string userId, BookmarkQuery query, CancellationToken cancellationToken);
}
