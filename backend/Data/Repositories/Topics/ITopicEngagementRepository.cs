using TechForum.Api.Dtos;

namespace TechForum.Api.Data.Repositories;

public interface ITopicEngagementRepository
{
    Task<TopicEngagementDto?> RecordViewAsync(
        Guid topicId,
        string visitorKeyHash,
        DateTimeOffset viewedAtUtc,
        CancellationToken cancellationToken);
    Task<TopicEngagementDto?> RecordShareAsync(Guid topicId, CancellationToken cancellationToken);
}
