namespace TechForum.Api.Data.Repositories;

public sealed record SkillTagData(Guid TagId, string Name, string Slug);

public interface IUserSkillRepository
{
    Task<IReadOnlyList<SkillTagData>> GetChosenAsync(string userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<Guid>> GetActiveTagIdsAsync(IReadOnlyCollection<Guid> tagIds, CancellationToken cancellationToken);

    Task ReplaceAsync(string userId, IReadOnlyCollection<Guid> tagIds, DateTimeOffset now, CancellationToken cancellationToken);
}
