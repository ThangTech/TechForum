using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Models;
using TechForum.Api.Services;
using TechForum.Api.Tests.Fakes;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class BannedWordServiceTests
{
    private readonly FakeBannedWordRepository repository = new();
    private readonly FakeFilter filter = new();
    private readonly FakeAudit audit = new();

    private BannedWordService CreateService() => new(repository, filter, audit, TimeProvider.System);

    [Fact]
    public async Task AddAsync_SavesTheWordInItsNormalForm_RecordsItAndRefreshesTheCache()
    {
        var result = await CreateService().AddAsync("admin", new SaveBannedWordRequest("  Dịp   NÀY "), default);

        Assert.Equal(BannedWordFailure.None, result.Failure);
        Assert.Equal("dịp này", result.Word!.Word);
        Assert.Equal("dịp này", Assert.Single(repository.Items).Word);
        Assert.Equal(["banned-word-added"], audit.Actions);
        Assert.Equal(1, filter.WarmUps);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("a")]
    [InlineData("!!!")]
    [InlineData("<script>")]
    [InlineData("a>b")]
    public async Task AddAsync_RefusesAWordThatIsNotValid(string? word)
    {
        var result = await CreateService().AddAsync("admin", new SaveBannedWordRequest(word), default);

        Assert.Equal(BannedWordFailure.Validation, result.Failure);
        Assert.Empty(repository.Items);
        Assert.Empty(audit.Actions);
        Assert.Equal(0, filter.WarmUps);
    }

    [Fact]
    public async Task AddAsync_RefusesAWordThatIsTooLong()
    {
        var result = await CreateService().AddAsync("admin", new SaveBannedWordRequest(new string('a', 61)), default);

        Assert.Equal(BannedWordFailure.Validation, result.Failure);
    }

    [Fact]
    public async Task AddAsync_RefusesADuplicateWhateverItsCaseAndSpaces()
    {
        var service = CreateService();
        await service.AddAsync("admin", new SaveBannedWordRequest("foobar"), default);

        var result = await service.AddAsync("admin", new SaveBannedWordRequest("  FOOBAR "), default);

        Assert.Equal(BannedWordFailure.Duplicate, result.Failure);
        Assert.Single(repository.Items);
        Assert.Equal(["banned-word-added"], audit.Actions);
    }

    [Fact]
    public async Task RemoveAsync_DeletesTheWord_RecordsItAndRefreshesTheCache()
    {
        repository.Items.Add(new BannedWord { Id = TestIds.Id(4), Word = "bazqux", CreatedAtUtc = DateTimeOffset.UtcNow });

        var result = await CreateService().RemoveAsync("admin", TestIds.Id(4), default);

        Assert.Equal(BannedWordFailure.None, result.Failure);
        Assert.Empty(repository.Items);
        Assert.Equal(["banned-word-removed"], audit.Actions);
        Assert.Equal(1, filter.WarmUps);
    }

    [Fact]
    public async Task RemoveAsync_ForAWordThatDoesNotExist_ReturnsNotFound()
    {
        var result = await CreateService().RemoveAsync("admin", TestIds.Id(99), default);

        Assert.Equal(BannedWordFailure.NotFound, result.Failure);
        Assert.Empty(audit.Actions);
        Assert.Equal(0, filter.WarmUps);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsTheWords()
    {
        repository.Items.Add(new BannedWord { Id = TestIds.Id(1), Word = "bazqux", CreatedAtUtc = DateTimeOffset.UtcNow });

        var words = await CreateService().GetAllAsync(default);

        Assert.Equal("bazqux", Assert.Single(words).Word);
    }

    private sealed class FakeFilter : IProfanityFilter
    {
        public int WarmUps { get; private set; }

        public Task<string> FilterAsync(string text, bool isHtml, CancellationToken cancellationToken) => Task.FromResult(text);

        public Task WarmUpAsync(CancellationToken cancellationToken)
        {
            WarmUps++;
            return Task.CompletedTask;
        }

        public void Invalidate()
        {
        }
    }

    private sealed class FakeAudit : IAdminAuditService
    {
        public List<string> Actions { get; } = [];

        public Task RecordAsync(
            string administratorId,
            string action,
            string targetType,
            string targetId,
            string? previousValue,
            string? newValue,
            string reason,
            CancellationToken cancellationToken)
        {
            Actions.Add(action);
            return Task.CompletedTask;
        }
    }
}
