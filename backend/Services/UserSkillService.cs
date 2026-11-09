using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public sealed class UserSkillService(
    IUserSkillRepository repository,
    TimeProvider timeProvider) : IUserSkillService
{
    public async Task<IReadOnlyList<SkillTagDto>> GetAsync(string userId, CancellationToken cancellationToken) =>
        Map(await repository.GetChosenAsync(userId, cancellationToken));

    public async Task<UserSkillResult> ReplaceAsync(
        string userId,
        IReadOnlyCollection<int> tagIds,
        CancellationToken cancellationToken)
    {
        // The same tag sent twice counts once.
        var wanted = tagIds.Distinct().ToList();
        if (wanted.Count > IUserSkillService.MaxSkills)
        {
            return new UserSkillResult(SkillFailure.TooMany, []);
        }

        var activeIds = await repository.GetActiveTagIdsAsync(wanted, cancellationToken);
        if (activeIds.Count != wanted.Count)
        {
            return new UserSkillResult(SkillFailure.UnknownTag, []);
        }

        await repository.ReplaceAsync(userId, wanted, timeProvider.GetUtcNow(), cancellationToken);
        return new UserSkillResult(SkillFailure.None, await GetAsync(userId, cancellationToken));
    }

    private static IReadOnlyList<SkillTagDto> Map(IReadOnlyList<SkillTagData> tags) =>
        tags.Select(tag => new SkillTagDto(tag.TagId, tag.Name, tag.Slug)).ToList();
}
