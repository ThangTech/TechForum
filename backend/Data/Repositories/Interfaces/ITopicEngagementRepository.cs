using TechForum.Api.Dtos;

namespace TechForum.Api.Data.Repositories;

public interface ITopicEngagementRepository
{
    Task<TopicEngagementDto?> RecordViewAsync(
        int topicId,
        string visitorKeyHash,
        DateTimeOffset viewedAtUtc,
        CancellationToken cancellationToken);
    Task<TopicEngagementDto?> RecordShareAsync(int topicId, CancellationToken cancellationToken);
}
