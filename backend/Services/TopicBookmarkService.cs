using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class TopicBookmarkService(
    ITopicRepository topicRepository,
    ITopicBookmarkRepository bookmarkRepository,
    TimeProvider timeProvider) : ITopicBookmarkService
{
    public async Task<BookmarkStatusDto?> GetStatusAsync(
        int topicId,
        string? userId,
        CancellationToken cancellationToken)
    {
        if (await topicRepository.GetPublicByIdAsync(topicId, cancellationToken) is null)
        {
            return null;
        }
        return await GetStatusCoreAsync(topicId, userId, cancellationToken);
    }

    public async Task<BookmarkStatusDto?> AddAsync(
        int topicId,
        string userId,
        CancellationToken cancellationToken)
    {
        if (await topicRepository.GetPublicByIdAsync(topicId, cancellationToken) is null)
        {
            return null;
        }
        await bookmarkRepository.AddAsync(topicId, userId, timeProvider.GetUtcNow(), cancellationToken);
        return await GetStatusCoreAsync(topicId, userId, cancellationToken);
    }

    public async Task<BookmarkStatusDto?> RemoveAsync(
        int topicId,
        string userId,
        CancellationToken cancellationToken)
    {
        if (await topicRepository.GetPublicByIdAsync(topicId, cancellationToken) is null)
        {
            return null;
        }
        await bookmarkRepository.RemoveAsync(topicId, userId, cancellationToken);
        return await GetStatusCoreAsync(topicId, userId, cancellationToken);
    }

    public async Task<PagedResultDto<SavedTopicDto>> GetSavedPageAsync(
        string userId,
        BookmarkQuery query,
        CancellationToken cancellationToken)
    {
        var page = await bookmarkRepository.GetPageAsync(
            userId,
            query.Page,
            query.PageSize,
            cancellationToken);
        var totalPages = page.TotalItems == 0
            ? 0
            : (int)Math.Ceiling(page.TotalItems / (double)query.PageSize);
        return new PagedResultDto<SavedTopicDto>(
            page.Items.Select(bookmark => SavedTopicMapper.Map(bookmark.Topic, bookmark.CreatedAtUtc)).ToList(),
            query.Page,
            query.PageSize,
            page.TotalItems,
            totalPages);
    }

    private async Task<BookmarkStatusDto> GetStatusCoreAsync(
        int topicId,
        string? userId,
        CancellationToken cancellationToken)
    {
        var count = await bookmarkRepository.CountAsync(topicId, cancellationToken);
        var hasBookmark = !string.IsNullOrWhiteSpace(userId) &&
            await bookmarkRepository.ExistsAsync(topicId, userId, cancellationToken);
        return new BookmarkStatusDto(count, hasBookmark);
    }
}
