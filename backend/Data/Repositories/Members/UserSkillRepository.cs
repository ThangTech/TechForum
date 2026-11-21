using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public sealed class UserSkillRepository(TechForumDbContext dbContext) : IUserSkillRepository
{
    public async Task<IReadOnlyList<SkillTagData>> GetChosenAsync(string userId, CancellationToken cancellationToken) =>
        await dbContext.UserSkills
            .AsNoTracking()
            .Where(skill => skill.UserId == userId && skill.Tag.IsActive)
            .OrderBy(skill => skill.Tag.Name)
            .ThenBy(skill => skill.TagId)
            .Select(skill => new SkillTagData(skill.TagId, skill.Tag.Name, skill.Tag.Slug))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Guid>> GetActiveTagIdsAsync(
        IReadOnlyCollection<Guid> tagIds,
        CancellationToken cancellationToken) =>
        await dbContext.Tags
            .AsNoTracking()
            .Where(tag => tagIds.Contains(tag.Id) && tag.IsActive)
            .Select(tag => tag.Id)
            .ToListAsync(cancellationToken);

    public async Task ReplaceAsync(
        string userId,
        IReadOnlyCollection<Guid> tagIds,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        // Two requests of the same member can arrive together and both add the same tag; the second one hits the
        // primary key. It then reads the rows again and finds the tag already there, so a second try is enough.
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
                when (attempt == 1 && exception.InnerException is SqlException { Number: 2601 or 2627 })
            {
                dbContext.ChangeTracker.Clear();
            }
        }
    }
}
