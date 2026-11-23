using TechForum.Api.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class UserSkillRepository : IUserSkillRepository
{
    private readonly TechForumDbContext dbContext;

    public UserSkillRepository(TechForumDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    public async Task<IReadOnlyList<SkillTagData>> GetChosenAsync(string userId, CancellationToken cancellationToken)
    {
        return await dbContext.UserSkills
            .AsNoTracking()
            .Where(skill => skill.UserId == userId && skill.Tag.IsActive)
            .OrderBy(skill => skill.Tag.Name)
            .ThenBy(skill => skill.TagId)
            .Select(skill => new SkillTagData(skill.TagId, skill.Tag.Name, skill.Tag.Slug))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Guid>> GetActiveTagIdsAsync(
        IReadOnlyCollection<Guid> tagIds,
        CancellationToken cancellationToken)
    {
        return await dbContext.Tags
            .AsNoTracking()
            .Where(tag => tagIds.Contains(tag.Id) && tag.IsActive)
            .Select(tag => tag.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task ReplaceAsync(
        string userId,
        IReadOnlyCollection<Guid> tagIds,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        // Hai yêu cầu cùng lúc có thể cùng thêm một thẻ; yêu cầu sau gặp khóa chính, đọc lại thì thấy thẻ đã có,
        // nên thử thêm một lần là đủ.
        for (var attempt = 1; ; attempt++)
        {
            var existing = await dbContext.UserSkills
                .Where(skill => skill.UserId == userId)
                .ToListAsync(cancellationToken);
            dbContext.UserSkills.RemoveRange(existing.Where(skill => !tagIds.Contains(skill.TagId)));
            var existingIds = existing.Select(skill => skill.TagId).ToHashSet();
            dbContext.UserSkills.AddRange(tagIds
                .Where(tagId => !existingIds.Contains(tagId))
                .Select(tagId => new UserSkill { UserId = userId, TagId = tagId, CreatedAtUtc = now }));
            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
                return;
            }
            catch (DbUpdateException exception)
                when (attempt == 1 && SqlErrors.IsDuplicateKey(exception))
            {
                dbContext.ChangeTracker.Clear();
            }
        }
    }
}
