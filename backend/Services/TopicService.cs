using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class TopicService(ITopicRepository topicRepository) : ITopicService
{
    public async Task<PagedResultDto<TopicSummaryDto>> GetPublicPageAsync(
        TopicQuery query,
        CancellationToken cancellationToken)
    {
        var page = await topicRepository.GetPublicPageAsync(query, cancellationToken);
        var totalPages = page.TotalItems == 0
            ? 0
            : (int)Math.Ceiling(page.TotalItems / (double)query.PageSize);

        return new PagedResultDto<TopicSummaryDto>(
            page.Items.Select(MapSummary).ToList(),
            query.Page,
            query.PageSize,
            page.TotalItems,
            totalPages);
    }

    public async Task<TopicDetailDto?> GetPublicByIdAsync(int id, CancellationToken cancellationToken)
    {
        var topic = await topicRepository.GetPublicByIdAsync(id, cancellationToken);
        return topic is null ? null : MapDetail(topic);
    }

    private static TopicSummaryDto MapSummary(Topic topic) => new(
        topic.Id,
        topic.Title,
        topic.Slug,
        topic.Summary,
        MapType(topic.Type),
        MapCategory(topic),
        MapAuthor(topic),
        MapTags(topic),
        topic.PublishedAtUtc!.Value,
        topic.IsPinned,
        topic.IsDiscussionLocked);

    private static TopicDetailDto MapDetail(Topic topic) => new(
        topic.Id,
        topic.Title,
        topic.Slug,
        topic.Summary,
        topic.BodyHtml,
        MapType(topic.Type),
        MapCategory(topic),
        MapAuthor(topic),
        MapTags(topic),
        topic.CreatedAtUtc,
        topic.PublishedAtUtc!.Value,
        topic.UpdatedAtUtc,
        topic.IsPinned,
        topic.IsDiscussionLocked);

    private static string MapType(TopicType type) => type switch
    {
        TopicType.Article => "article",
        TopicType.Question => "question",
        _ => throw new InvalidOperationException($"Unsupported topic type: {type}")
    };

    private static TopicCategoryDto MapCategory(Topic topic) =>
        new(topic.Category.Id, topic.Category.Name, topic.Category.Slug);

    private static TopicAuthorDto MapAuthor(Topic topic) =>
        new(topic.Author.Id, topic.Author.DisplayName);

    private static IReadOnlyList<TopicTagDto> MapTags(Topic topic) => topic.TopicTags
        .Where(item => item.Tag.IsActive)
        .OrderBy(item => item.Tag.Name)
        .ThenBy(item => item.TagId)
        .Select(item => new TopicTagDto(item.TagId, item.Tag.Name, item.Tag.Slug))
        .ToList();
}
