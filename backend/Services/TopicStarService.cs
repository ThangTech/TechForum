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
        if (topic is null) return null;

        return await GetStatusAsync(topicId, userId, cancellationToken);
    }

    public async Task<TopicStarDto?> AddAsync(
        int topicId,
        string userId,
        CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null) return null;

        await topicStarRepository.AddAsync(
            topicId,
            userId,
            timeProvider.GetUtcNow(),
            cancellationToken);
        return await GetStatusAsync(topicId, userId, cancellationToken);
    }

    public async Task<TopicStarDto?> RemoveAsync(
        int topicId,
        string userId,
        CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null) return null;

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
