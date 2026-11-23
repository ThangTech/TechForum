using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public sealed class UserSkillService : IUserSkillService
{
    private readonly IUserSkillRepository repository;
    private readonly TimeProvider timeProvider;

    public UserSkillService(IUserSkillRepository repository, TimeProvider timeProvider)
    {
        this.repository = repository;
        this.timeProvider = timeProvider;
    }

    public async Task<IReadOnlyList<SkillTagDto>> GetAsync(string userId, CancellationToken cancellationToken) =>
        Map(await repository.GetChosenAsync(userId, cancellationToken));

    public async Task<Result<IReadOnlyList<SkillTagDto>>> ReplaceAsync(
        string userId,
        IReadOnlyCollection<Guid> tagIds,
        CancellationToken cancellationToken)
    {
        // The same tag sent twice counts once.
        var wanted = tagIds.Distinct().ToList();
        if (wanted.Count > IUserSkillService.MaxSkills)
        {
            return Result<IReadOnlyList<SkillTagDto>>.Fail(ErrorType.Validation, null,
                $"Mỗi thành viên chọn tối đa {IUserSkillService.MaxSkills} kỹ năng.", "tagIds");
        }

        var activeIds = await repository.GetActiveTagIdsAsync(wanted, cancellationToken);
        if (activeIds.Count != wanted.Count)
        {
            return Result<IReadOnlyList<SkillTagDto>>.Fail(ErrorType.Validation, null,
                "Có thẻ không tồn tại hoặc đã bị tắt. Hãy tải lại danh sách thẻ.", "tagIds");
        }

        await repository.ReplaceAsync(userId, wanted, timeProvider.GetUtcNow(), cancellationToken);
        return Result<IReadOnlyList<SkillTagDto>>.Success(await GetAsync(userId, cancellationToken));
    }

    private static IReadOnlyList<SkillTagDto> Map(IReadOnlyList<SkillTagData> tags) =>
        tags.Select(tag => new SkillTagDto(tag.TagId, tag.Name, tag.Slug)).ToList();
}
