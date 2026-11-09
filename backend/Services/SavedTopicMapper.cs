using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

// The topic of a list that belongs to one member ("Đã lưu", "Đã thả sao"): the same short card for both lists.
// savedAtUtc is the time the member saved it or gave it a star.
public static class SavedTopicMapper
{
    public static SavedTopicDto Map(Topic topic, DateTimeOffset savedAtUtc)
    {
        if (topic.PublishedAtUtc is null || topic.Status != TopicStatus.Published)
        {
            throw new InvalidOperationException("Danh sách cá nhân chứa chủ đề chưa xuất bản.");
        }

        return new SavedTopicDto(
            topic.Id,
            topic.Title,
            topic.Summary,
            topic.Type == TopicType.Article ? "article" : "question",
            new TopicCategoryDto(topic.Category.Id, topic.Category.Name, topic.Category.Slug),
            new TopicAuthorDto(topic.Author.Id, topic.Author.DisplayName),
            topic.TopicTags
                .Where(item => item.Tag.IsActive)
                .OrderBy(item => item.Tag.Name)
                .Select(item => new TopicTagDto(item.TagId, item.Tag.Name, item.Tag.Slug))
                .ToList(),
            topic.PublishedAtUtc.Value,
            savedAtUtc);
    }
}
