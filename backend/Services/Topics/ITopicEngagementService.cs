using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ITopicEngagementService
{
    Task<TopicEngagementDto?> RecordViewAsync(Guid topicId, string visitorKey, CancellationToken cancellationToken);
    Task<TopicEngagementDto?> RecordShareAsync(Guid topicId, CancellationToken cancellationToken);
}
