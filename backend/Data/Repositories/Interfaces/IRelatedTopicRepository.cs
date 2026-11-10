namespace TechForum.Api.Data.Repositories;

public interface IRelatedTopicRepository
{
    Task<IReadOnlyList<RelatedTopicData>?> GetPublicRelatedAsync(
        Guid topicId,
        int limit,
        CancellationToken cancellationToken);
}
