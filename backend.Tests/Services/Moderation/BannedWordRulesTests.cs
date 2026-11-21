using TechForum.Api.Data.Repositories;
using TechForum.Api.Models;
using TechForum.Api.Services;
using TechForum.Api.Tests.Fakes;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class BannedWordRulesTests
{
    [Theory]
    [InlineData("  FooBar  ", "foobar")]
    [InlineData("Dịp   NÀY", "dịp này")]
    [InlineData("ab", "ab")]
    public void TryNormalize_AcceptsAWordAndGivesItsSavedForm(string raw, string expected)
    {
        Assert.True(BannedWordRules.TryNormalize(raw, out var word));
        Assert.Equal(expected, word);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("a")]
    [InlineData("!!!")]
    [InlineData("a<b")]
    [InlineData("a>b")]
    [InlineData("ab\u0007cd")]
    public void TryNormalize_RefusesAWordThatIsNotAllowed(string? raw)
    {
        Assert.False(BannedWordRules.TryNormalize(raw, out _));
    }

    [Fact]
    public void TryNormalize_RefusesAWordThatIsTooLong()
    {
        Assert.True(BannedWordRules.TryNormalize(new string('a', BannedWordRules.MaxLength), out _));
        Assert.False(BannedWordRules.TryNormalize(new string('a', BannedWordRules.MaxLength + 1), out _));
    }

    [Fact]
    public void ParseLines_SkipsNotesBlankLinesAndWordsThatAreNotAllowed_AndKeepsEachWordOnce()
    {
        var lines = new[]
        {
            "# a note",
            "",
            "   ",
            "FooBar",
            "  bazqux  ",
            "foobar",
            "x",
            "<b>",
            "  # a note with spaces before it",
            "dịp này",
        };

        Assert.Equal(["foobar", "bazqux", "dịp này"], BannedWordRules.ParseLines(lines));
    }
}

public sealed class BannedWordSeederTests
{
    private readonly FakeBannedWordRepository repository = new();

    private BannedWordSeeder CreateSeeder() => new(repository, TimeProvider.System, NullLogger<BannedWordSeeder>.Instance);

    [Fact]
    public async Task SeedIfEmptyAsync_FillsAnEmptyTableWithTheWordsOfTheLines()
    {
        var added = await CreateSeeder().SeedIfEmptyAsync(["# note", "FooBar", "bazqux", "foobar"], default);

        Assert.Equal(2, added);
        Assert.Equal(["bazqux", "foobar"], repository.Items.Select(item => item.Word).Order().ToList());
        Assert.All(repository.Items, item => Assert.NotEqual(default, item.CreatedAtUtc));
    }

    [Fact]
    public async Task SeedIfEmptyAsync_DoesNothingWhenTheTableAlreadyHasWords()
    {
        repository.Items.Add(new BannedWord { Id = TestIds.Id(1), Word = "kept", CreatedAtUtc = DateTimeOffset.UtcNow });

        var added = await CreateSeeder().SeedIfEmptyAsync(["foobar", "bazqux"], default);

        Assert.Equal(0, added);
        Assert.Equal("kept", Assert.Single(repository.Items).Word);
        Assert.Equal(0, repository.AddRangeCalls);
    }

    [Fact]
    public async Task SeedIfEmptyAsync_DoesNotBringBackAWordThatAnAdminDeleted()
    {
        var seeder = CreateSeeder();
        await seeder.SeedIfEmptyAsync(["foobar", "bazqux"], default);
        repository.Items.RemoveAll(item => item.Word == "foobar");

        // The next start of the application reads the file again.
        await seeder.SeedIfEmptyAsync(["foobar", "bazqux"], default);

        Assert.Equal("bazqux", Assert.Single(repository.Items).Word);
    }

    [Theory]
    [InlineData]
    [InlineData("# only a note", "", "  ")]
    [InlineData("x", "<")]
    public async Task SeedIfEmptyAsync_WithNoAllowedWord_DoesNotTouchTheTable(params string[] lines)
    {
        var added = await CreateSeeder().SeedIfEmptyAsync(lines, default);

        Assert.Equal(0, added);
        Assert.Equal(0, repository.AddRangeCalls);
    }
}
