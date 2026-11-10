using TechForum.Api.Dtos;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface ITopicRepository
{
    Task<TopicPage> GetPublicPageAsync(TopicQuery query, CancellationToken cancellationToken);

    Task<TopicPage> GetFollowingPageAsync(
        string followerId,
        TopicQuery query,
        CancellationToken cancellationToken);

    Task<TopicPage> GetOwnedPageAsync(
        string authorId,
        TopicQuery query,
        CancellationToken cancellationToken);

    Task<Topic?> GetPublicByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<Topic?> GetOwnedByIdAsync(
        Guid id,
        string authorId,
        CancellationToken cancellationToken);

    Task<Category?> GetCategoryByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<IReadOnlyList<Tag>> GetActiveTagsByIdsAsync(
        IReadOnlyCollection<Guid> ids,
        CancellationToken cancellationToken);

    Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken);

    Task<bool> HasPublicAnswersAsync(Guid topicId, CancellationToken cancellationToken);

    // Saves a new topic. Returns false when another topic already uses the same slug.
    // The topic stays tracked, so the caller can change the slug and call this again.
    Task<bool> TryAddAsync(Topic topic, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
