using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IUserSkillService
{
    // A member may have at most this many skills of their own choice.
    const int MaxSkills = 12;

    Task<IReadOnlyList<SkillTagDto>> GetAsync(string userId, CancellationToken cancellationToken);

    Task<Result<IReadOnlyList<SkillTagDto>>> ReplaceAsync(string userId, IReadOnlyCollection<Guid> tagIds, CancellationToken cancellationToken);
}
