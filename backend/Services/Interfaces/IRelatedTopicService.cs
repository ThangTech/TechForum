using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IRelatedTopicService
{
    Task<IReadOnlyList<RelatedTopicDto>?> GetPublicRelatedAsync(
        int topicId,
        CancellationToken cancellationToken);
}
