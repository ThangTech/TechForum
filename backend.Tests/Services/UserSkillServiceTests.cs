using TechForum.Api.Data.Repositories;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class UserSkillServiceTests
{
    private readonly FakeRepository repository = new();

    private UserSkillService CreateService() => new(repository, TimeProvider.System);

    [Fact]
    public async Task ReplaceAsync_SavesTheChosenTagsAndGivesThemBack()
    {
        var result = await CreateService().ReplaceAsync("member-a", [2, 1], CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal(["ASP.NET Core", "React"], result.Skills.Select(skill => skill.Name));
        Assert.Equal([2, 1], repository.Saved["member-a"]);
    }

    [Fact]
    public async Task ReplaceAsync_CountsTheSameTagSentTwiceOnce()
    {
        var result = await CreateService().ReplaceAsync("member-a", [1, 1, 1], CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal([1], repository.Saved["member-a"]);
    }

    [Fact]
    public async Task ReplaceAsync_WithAnEmptyList_RemovesEverySkill()
    {
        repository.Saved["member-a"] = [1, 2];

        var result = await CreateService().ReplaceAsync("member-a", [], CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Empty(result.Skills);
        Assert.Empty(repository.Saved["member-a"]);
    }

    [Fact]
    public async Task ReplaceAsync_RefusesATagThatDoesNotExistOrIsTurnedOffAndChangesNothing()
    {
        repository.Saved["member-a"] = [1];

        var unknown = await CreateService().ReplaceAsync("member-a", [1, 99], CancellationToken.None);
        var turnedOff = await CreateService().ReplaceAsync("member-a", [3], CancellationToken.None);

        Assert.Equal(SkillFailure.UnknownTag, unknown.Failure);
        Assert.Equal(SkillFailure.UnknownTag, turnedOff.Failure);
        Assert.Equal([1], repository.Saved["member-a"]);
    }

    [Fact]
    public async Task ReplaceAsync_RefusesMoreSkillsThanTheLimit()
    {
        var tooMany = Enumerable.Range(1, IUserSkillService.MaxSkills + 1).ToList();

        var result = await CreateService().ReplaceAsync("member-a", tooMany, CancellationToken.None);

        Assert.Equal(SkillFailure.TooMany, result.Failure);
        Assert.False(repository.Saved.ContainsKey("member-a"));
    }

    [Fact]
    public async Task ReplaceAsync_DoesNotTouchTheSkillsOfAnotherMember()
    {
        repository.Saved["member-b"] = [2];

        await CreateService().ReplaceAsync("member-a", [1], CancellationToken.None);

        Assert.Equal([2], repository.Saved["member-b"]);
    }

    // Tags 1 and 2 are active, tag 3 is turned off.
    private sealed class FakeRepository : IUserSkillRepository
    {
        private static readonly Dictionary<int, (string Name, string Slug, bool IsActive)> Tags = new()
        {
            [1] = ("React", "react", true),
            [2] = ("ASP.NET Core", "asp-net-core", true),
            [3] = ("Old tag", "old-tag", false)
        };

        public Dictionary<string, List<int>> Saved { get; } = [];

        public Task<IReadOnlyList<SkillTagData>> GetChosenAsync(string userId, CancellationToken cancellationToken)
        {
            var ids = Saved.GetValueOrDefault(userId) ?? [];
            IReadOnlyList<SkillTagData> chosen = ids
                .Where(id => Tags[id].IsActive)
                .Select(id => new SkillTagData(id, Tags[id].Name, Tags[id].Slug))
                .OrderBy(tag => tag.Name, StringComparer.Ordinal)
                .ToList();
            return Task.FromResult(chosen);
        }

        public Task<IReadOnlyList<int>> GetActiveTagIdsAsync(
            IReadOnlyCollection<int> tagIds,
            CancellationToken cancellationToken)
        {
            IReadOnlyList<int> active = tagIds.Where(id => Tags.TryGetValue(id, out var tag) && tag.IsActive).ToList();
            return Task.FromResult(active);
        }

        public Task ReplaceAsync(
            string userId,
            IReadOnlyCollection<int> tagIds,
            DateTimeOffset now,
            CancellationToken cancellationToken)
        {
            Saved[userId] = [.. tagIds];
            return Task.CompletedTask;
        }
    }
}
