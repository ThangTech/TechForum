using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class PublicProfileService : IPublicProfileService
{
    private readonly IPublicProfileRepository profileRepository;

    public PublicProfileService(IPublicProfileRepository profileRepository)
    {
        this.profileRepository = profileRepository;
    }

    public async Task<PublicProfileDto?> GetByUserIdAsync(
        string userId,
        string? viewerId,
        CancellationToken cancellationToken)
    {
        var profile = await profileRepository.GetByUserIdAsync(userId, viewerId, cancellationToken);
        if (profile is null)
        {
            return null;
        }

        return new PublicProfileDto(
            profile.User.Id,
            profile.User.DisplayName,
            profile.User.Bio,
            profile.User.AvatarUrl,
            profile.User.CreatedAtUtc,
            profile.PublishedTopicCount,
            profile.PublicAnswerCount,
            profile.ReceivedUpvoteCount,
            profile.FollowerCount,
            profile.FollowingCount,
            profile.IsFollowedByViewer,
            profile.Skills.Select(skill => new ProfileSkillDto(
                skill.TagId, skill.Name, skill.Slug, skill.TopicCount, skill.IsChosen)).ToList(),
            CreateBadges(profile),
            profile.RecentTopics.Select(MapTopic).ToList(),
            ReputationRules.ForDisplay(profile.User.Reputation));
    }

    private static IReadOnlyList<ProfileBadgeDto> CreateBadges(PublicProfileData profile)
    {
        var badges = new List<ProfileBadgeDto>();
        if (profile.PublishedTopicCount >= 3)
        {
            badges.Add(new("contributor", "Người chia sẻ", "Đã đăng ít nhất 3 nội dung công khai."));
        }
        if (profile.PublicAnswerCount >= 5)
        {
            badges.Add(new("discussant", "Người thảo luận", "Đã đóng góp ít nhất 5 câu trả lời công khai."));
        }
        if (profile.ReceivedUpvoteCount >= 10)
        {
            badges.Add(new("helpful", "Nội dung hữu ích", "Bài viết và câu trả lời đã nhận ít nhất 10 bình chọn tốt."));
        }
        return badges;
    }

    private static TopicSummaryDto MapTopic(Topic topic)
    {
        return new(
            topic.Id,
            topic.Title,
            topic.Slug,
            topic.Summary,
            topic.Type.ToString().ToLowerInvariant(),
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
            topic.ShareCount,
            CoverImageUrl: topic.CoverImageUrl);
    }
}
