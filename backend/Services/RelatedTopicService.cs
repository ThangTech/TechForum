using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Enums;

namespace TechForum.Api.Services;

public sealed class RelatedTopicService(IRelatedTopicRepository repository) : IRelatedTopicService
{
    public async Task<IReadOnlyList<RelatedTopicDto>?> GetPublicRelatedAsync(
        int topicId,
        CancellationToken cancellationToken)
    {
        var topics = await repository.GetPublicRelatedAsync(topicId, 4, cancellationToken);
        if (topics is null) return null;

        return topics.Select(topic => new RelatedTopicDto(
            topic.Id,
            topic.Title,
            topic.Summary,
            topic.Type == TopicType.Question ? "question" : "article",
            new TopicCategoryDto(topic.CategoryId, topic.CategoryName, topic.CategorySlug),
            new TopicAuthorDto(topic.AuthorId, topic.AuthorDisplayName),
            topic.PublishedAtUtc,
            topic.SharedTagCount,
            topic.IsSameCategory)).ToList();
    }
}
