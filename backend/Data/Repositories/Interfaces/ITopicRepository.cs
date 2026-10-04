using TechForum.Api.Dtos;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface ITopicRepository
{
    Task<TopicPage> GetPublicPageAsync(TopicQuery query, CancellationToken cancellationToken);

    Task<TopicPage> GetOwnedPageAsync(
        string authorId,
        TopicQuery query,
        CancellationToken cancellationToken);

    Task<Topic?> GetPublicByIdAsync(int id, CancellationToken cancellationToken);

    Task<Topic?> GetOwnedByIdAsync(
        int id,
        string authorId,
        CancellationToken cancellationToken);

    Task<Category?> GetCategoryByIdAsync(int id, CancellationToken cancellationToken);

    Task<IReadOnlyList<Tag>> GetActiveTagsByIdsAsync(
        IReadOnlyCollection<int> ids,
        CancellationToken cancellationToken);

    Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken);

    Task<bool> HasPublicAnswersAsync(int topicId, CancellationToken cancellationToken);

    Task AddAsync(Topic topic, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
