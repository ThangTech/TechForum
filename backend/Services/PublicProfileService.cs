using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class PublicProfileService(IPublicProfileRepository profileRepository)
    : IPublicProfileService
{
    public async Task<PublicProfileDto?> GetByUserIdAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        var profile = await profileRepository.GetByUserIdAsync(userId, cancellationToken);
        if (profile is null)
        {
            return null;
        }

        return new PublicProfileDto(
            profile.User.Id,
            profile.User.DisplayName,
            profile.User.CreatedAtUtc,
            profile.PublishedTopicCount,
            profile.RecentTopics.Select(MapTopic).ToList());
    }

    private static TopicSummaryDto MapTopic(Topic topic) => new(
        topic.Id,
        topic.Title,
        topic.Slug,
        topic.Summary,
        topic.Type switch
        {
            TopicType.Article => "article",
            TopicType.Question => "question",
            _ => throw new InvalidOperationException($"Unsupported topic type: {topic.Type}")
        },
        new TopicCategoryDto(topic.Category.Id, topic.Category.Name, topic.Category.Slug),
        new TopicAuthorDto(topic.Author.Id, topic.Author.DisplayName),
        topic.TopicTags
            .Where(item => item.Tag.IsActive)
            .OrderBy(item => item.Tag.Name)
            .ThenBy(item => item.TagId)
            .Select(item => new TopicTagDto(item.TagId, item.Tag.Name, item.Tag.Slug))
            .ToList(),
        topic.PublishedAtUtc!.Value,
        topic.IsPinned,
        topic.IsDiscussionLocked,
        topic.ViewCount,
        topic.ShareCount);
}
