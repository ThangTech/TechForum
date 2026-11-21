using System.Text;
using TechForum.Api.Services;
using Xunit;

// The words used in the tests are made-up ("foobar", "bazqux") or harmless real words with accents ("cặp", "dịp"):
// the list of real banned words stays out of the repository (see .gitignore).
namespace TechForum.Api.Tests.Services;

public sealed class ProfanityFilterSetTests
{
    private static ProfanityFilterSet CreateSet(params string[] words) => new(words);

    [Fact]
    public void Apply_ReplacesABannedWordWhateverItsCase()
    {
        var set = CreateSet("foobar");

        Assert.Equal("what *** is this and *** and ***", set.Apply("what foobar is this and FOOBAR and Foobar", false));
    }

    [Fact]
    public void Apply_OnlyFindsWholeWords()
    {
        var set = CreateSet("cat", "bazqux");

        // "category", "concat", "scatter" and "bobcat" contain the letters but are not the banned word.
        Assert.Equal("category concat scatter bobcat", set.Apply("category concat scatter bobcat", false));
        Assert.Equal("you *** and *** are *** ", set.Apply("you cat and bazqux are cat ", false));
    }

    [Fact]
    public void Apply_FindsAWordBesideSignsOfPunctuation()
    {
        var set = CreateSet("bazqux");

        Assert.Equal("(***), ***! \"***\" ***.", set.Apply("(bazqux), bazqux! \"bazqux\" bazqux.", false));
    }

    [Fact]
    public void Apply_TreatsAccentsAsPartOfTheWord()
    {
        var set = CreateSet("cặp", "dịp");

        // "dip" has no accent and "các" is another word: only the exact accented words are replaced.
        Assert.Equal("các bạn *** dip ***", set.Apply("các bạn cặp dip dịp", false));
    }

    [Fact]
    public void Apply_FindsAnAccentedWordInUpperCaseAndWithSeparateAccentMarks()
    {
        var set = CreateSet("dịp");

        Assert.Equal("***", set.Apply("DỊP", false));
        // The same word typed as letters plus separate accent marks (some keyboards and pasted texts do this).
        Assert.Equal("***", set.Apply("dịp".Normalize(NormalizationForm.FormD), false));
    }

    [Fact]
    public void Apply_ReplacesAPhraseAndTheLongestWordWins()
    {
        var set = CreateSet("dịp", "dịp này");

        Assert.Equal("*** nó", set.Apply("dịp này nó", false));
        Assert.Equal("*** nó", set.Apply("dịp   này nó", false));
        Assert.Equal("*** hay ***", set.Apply("dịp hay dịp", false));
    }

    [Fact]
    public void Apply_ChangesOnlyTheTextOfHtmlNotTagsOrAttributes()
    {
        var set = CreateSet("bazqux", "foobar");

        var html = "<p class=\"bazqux\">a bazqux <a href=\"https://foobar.example/x\" title=\"foobar\">foobar link</a></p><img alt=\"bazqux\" src=\"/a.png\">";

        Assert.Equal(
            "<p class=\"bazqux\">a *** <a href=\"https://foobar.example/x\" title=\"foobar\">*** link</a></p><img alt=\"bazqux\" src=\"/a.png\">",
            set.Apply(html, true));
    }

    [Fact]
    public void Apply_FindsAWordNextToAnHtmlEntityOrTag()
    {
        var set = CreateSet("bazqux");

        Assert.Equal("<b>***</b>&nbsp;***<br>***", set.Apply("<b>bazqux</b>&nbsp;bazqux<br>bazqux", true));
    }

    [Fact]
    public void Apply_WithoutWords_ReturnsTheSameText()
    {
        var set = CreateSet();

        Assert.Equal(0, set.WordCount);
        Assert.Equal("anything goes", set.Apply("anything goes", false));
        Assert.Equal("", set.Apply("", true));
    }

    [Fact]
    public void Apply_DoesNotTreatRegexSignsInAWordAsPattern()
    {
        var set = CreateSet("a.b", "c++", "(x)");

        Assert.Equal("axb stays, *** goes, c+ stays", set.Apply("axb stays, a.b goes, c+ stays", false));
    }

    [Theory]
    [InlineData("  Dịp   NÀY ", "dịp này")]
    [InlineData("FOOBAR", "foobar")]
    [InlineData("\tfoo\nbar", "foo bar")]
    public void NormalizeWord_TrimsLowersAndKeepsOneSpace(string input, string expected)
    {
        Assert.Equal(expected, ProfanityFilterSet.NormalizeWord(input));
    }

    [Fact]
    public void NormalizeWord_WritesAccentsInOneCharacter()
    {
        var separate = "dịp".Normalize(NormalizationForm.FormD);

        Assert.Equal("dịp".Normalize(NormalizationForm.FormC), ProfanityFilterSet.NormalizeWord(separate));
    }

    [Fact]
    public void Constructor_IgnoresBlankWordsAndDuplicates()
    {
        var set = CreateSet("foobar", "FOOBAR", " foobar ", "", "   ");

        Assert.Equal(1, set.WordCount);
    }
}
