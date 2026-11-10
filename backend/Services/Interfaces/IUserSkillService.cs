using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public enum SkillFailure
{
    None,
    // More skills than a member may have.
    TooMany,
    // A tag that does not exist or was turned off.
    UnknownTag
}

public sealed record UserSkillResult(SkillFailure Failure, IReadOnlyList<SkillTagDto> Skills)
{
    public bool Succeeded => Failure == SkillFailure.None;
}

public interface IUserSkillService
{
    // A member may have at most this many skills of their own choice.
    const int MaxSkills = 12;

    Task<IReadOnlyList<SkillTagDto>> GetAsync(string userId, CancellationToken cancellationToken);

    Task<UserSkillResult> ReplaceAsync(string userId, IReadOnlyCollection<Guid> tagIds, CancellationToken cancellationToken);
}
