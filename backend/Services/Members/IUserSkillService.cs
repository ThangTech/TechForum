using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IUserSkillService
{
    const int MaxSkills = 12;

    Task<IReadOnlyList<SkillTagDto>> GetAsync(string userId, CancellationToken cancellationToken);

    Task<Result<IReadOnlyList<SkillTagDto>>> ReplaceAsync(string userId, IReadOnlyCollection<Guid> tagIds, CancellationToken cancellationToken);
}
