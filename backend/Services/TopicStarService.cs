using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public sealed class TopicStarService(
    ITopicRepository topicRepository,
    ITopicStarRepository topicStarRepository,
    TimeProvider timeProvider) : ITopicStarService
{
    public async Task<TopicStarDto?> GetAsync(
        int topicId,
        string? userId,
        CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null)
        {
            return null;
        }

        return await GetStatusAsync(topicId, userId, cancellationToken);
    }

    public async Task<TopicStarDto?> AddAsync(
        int topicId,
        string userId,
        CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null)
        {
            return null;
        }

        await topicStarRepository.AddAsync(
            topicId,
            userId,
            timeProvider.GetUtcNow(),
            cancellationToken);
        return await GetStatusAsync(topicId, userId, cancellationToken);
    }

    public async Task<PagedResultDto<SavedTopicDto>> GetStarredPageAsync(
        string userId,
        BookmarkQuery query,
        CancellationToken cancellationToken)
    {
        var page = await topicStarRepository.GetPageAsync(userId, query.Page, query.PageSize, cancellationToken);
        var totalPages = page.TotalItems == 0 ? 0 : (int)Math.Ceiling(page.TotalItems / (double)query.PageSize);
        return new PagedResultDto<SavedTopicDto>(
            page.Items.Select(star => SavedTopicMapper.Map(star.Topic, star.CreatedAtUtc)).ToList(),
            query.Page,
            query.PageSize,
            page.TotalItems,
            totalPages);
    }

    public async Task<TopicStarDto?> RemoveAsync(
        int topicId,
        string userId,
        CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null)
        {
            return null;
        }

        await topicStarRepository.RemoveAsync(topicId, userId, cancellationToken);
        return await GetStatusAsync(topicId, userId, cancellationToken);
    }

    private async Task<TopicStarDto> GetStatusAsync(
        int topicId,
        string? userId,
        CancellationToken cancellationToken)
    {
        var count = await topicStarRepository.CountAsync(topicId, cancellationToken);
        var hasStar = !string.IsNullOrWhiteSpace(userId) &&
            await topicStarRepository.ExistsAsync(topicId, userId, cancellationToken);
        return new TopicStarDto(count, hasStar);
    }
}
