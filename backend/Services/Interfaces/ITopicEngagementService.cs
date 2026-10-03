using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ITopicEngagementService
{
    Task<TopicEngagementDto?> RecordViewAsync(int topicId, string visitorKey, CancellationToken cancellationToken);
    Task<TopicEngagementDto?> RecordShareAsync(int topicId, CancellationToken cancellationToken);
}
