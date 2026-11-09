namespace TechForum.Api.Data.Repositories;

public sealed record SkillTagData(int TagId, string Name, string Slug);

public interface IUserSkillRepository
{
    // The skills that the member chose, only the tags that are still active, in alphabetical order.
    Task<IReadOnlyList<SkillTagData>> GetChosenAsync(string userId, CancellationToken cancellationToken);

    // From the given ids, those that are tags which exist and are active.
    Task<IReadOnlyList<int>> GetActiveTagIdsAsync(IReadOnlyCollection<int> tagIds, CancellationToken cancellationToken);

    // Makes the skills of the member exactly the given tags: the others are removed and the new ones are added.
    Task ReplaceAsync(string userId, IReadOnlyCollection<int> tagIds, DateTimeOffset now, CancellationToken cancellationToken);
}
