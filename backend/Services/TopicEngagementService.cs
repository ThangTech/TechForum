using System.Security.Cryptography;
using System.Text;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public sealed class TopicEngagementService(
    ITopicEngagementRepository repository,
    TimeProvider timeProvider) : ITopicEngagementService
{
    public Task<TopicEngagementDto?> RecordViewAsync(
        int topicId,
        string visitorKey,
        CancellationToken cancellationToken)
    {
        var hash = Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(visitorKey)));
        return repository.RecordViewAsync(topicId, hash, timeProvider.GetUtcNow(), cancellationToken);
    }

    public Task<TopicEngagementDto?> RecordShareAsync(int topicId, CancellationToken cancellationToken) =>
        repository.RecordShareAsync(topicId, cancellationToken);
}
