namespace TechForum.Api.Data.Repositories;

public interface IRelatedTopicRepository
{
    Task<IReadOnlyList<RelatedTopicData>?> GetPublicRelatedAsync(
        int topicId,
        int limit,
        CancellationToken cancellationToken);
}
