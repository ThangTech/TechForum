using System.Text;
using TechForum.Api.Services;
using Xunit;

// The words used in the tests are made-up ("foobar", "bazqux") or harmless real words with accents ("cặp", "dịp", "đỏ"):
// the list of real banned words stays out of the repository (see .gitignore). The last test reads that list when it is
// on this computer and checks it against the same rules.
namespace TechForum.Api.Tests.Services;

// The words that a writer hides on purpose, and the normal words that must not be taken for them.
public sealed class ProfanityEvasionTests
{
    private static ProfanityFilterSet CreateSet(params string[] words) => new(words);

    [Theory]
    [InlineData("f.o.o.b.a.r")]
    [InlineData("f o o b a r")]
    [InlineData("f-o-o-b-a-r")]
    [InlineData("f_o_o_b_a_r")]
    [InlineData("foooooobar")]
    [InlineData("FFFOOOBBBAAARRR")]
    [InlineData("f0obar")]
    [InlineData("f00b4r")]
    [InlineData("foob@r")]
    [InlineData("fo*bar")]
    [InlineData("f**bar")]
    [InlineData("fooba*")]
    public void Apply_FindsAWordHiddenWithSeparatorsRepeatsSignsOrStars(string written)
    {
        var set = CreateSet("foobar");

        Assert.Equal("what *** is this", set.Apply($"what {written} is this", false));
    }

    [Theory]
    [InlineData("b4zqux")]
    [InlineData("8azqux")]
    [InlineData("baz.q.ux")]
    [InlineData("b.a.z.q.u.x")]
    [InlineData("b*zqux")]
    [InlineData("bazzzqux")]
    public void Apply_FindsAnotherWordHiddenTheSameWays(string written)
    {
        var set = CreateSet("bazqux");

        Assert.Equal("you ***", set.Apply($"you {written}", false));
    }

    [Theory]
    [InlineData("c.ặ.p")]
    [InlineData("c ặ p")]
    [InlineData("c-a-p")]
    [InlineData("cặppp")]
    [InlineData("cặpppp")]
    [InlineData("c4p")]
    [InlineData("c*p")]
    [InlineData("CẶ.P")]
    public void Apply_FindsAThreeLetterAccentedWordWhenSomethingIsHidden(string written)
    {
        var set = CreateSet("cặp", "dịp");

        Assert.Equal("nó ***", set.Apply($"nó {written}", false));
    }

    [Theory]
    [InlineData("đ.ỏ")]
    [InlineData("đ-ỏ")]
    [InlineData("Đ_Ỏ")]
    [InlineData("d.ỏ")]
    [InlineData("đ.o")]
    [InlineData("đ*")]
    public void Apply_FindsATwoLetterWordWithASignBetweenItsLetters(string written)
    {
        var set = CreateSet("đỏ");

        // "đ*" has a single real character, which is not enough to take it for a word.
        var expected = written == "đ*" ? $"nó {written}" : "nó ***";
        Assert.Equal(expected, set.Apply($"nó {written}", false));
    }

    [Theory]
    [InlineData("đ ỏ")]
    [InlineData("đỏỏỏ")]
    [InlineData("do")]
    [InlineData("đo")]
    [InlineData("dỏ")]
    [InlineData("doo")]
    [InlineData("đoo")]
    [InlineData("đo đạc")]
    [InlineData("đòn")]
    public void Apply_DoesNotTakeACommonShortWordForAHiddenTwoLetterWord(string text)
    {
        var set = CreateSet("đỏ", "đẻ");

        Assert.Equal(text, set.Apply(text, false));
    }

    [Theory]
    [InlineData("để")]
    [InlineData("đề tài")]
    [InlineData("de")]
    [InlineData("dee")]
    [InlineData("đẻo")]
    [InlineData("đê")]
    public void Apply_DoesNotTakeAVeryCommonWordForAHiddenTwoLetterWord(string text)
    {
        var set = CreateSet("đỏ", "đẻ");

        Assert.Equal(text, set.Apply(text, false));
    }

    [Theory]
    [InlineData("cap")]
    [InlineData("cạp")]
    [InlineData("Cắp")]
    [InlineData("dip")]
    [InlineData("dip nay")]
    [InlineData("các bạn")]
    public void Apply_LeavesAWordWithMissingOrDifferentAccentsAlone(string text)
    {
        var set = CreateSet("cặp", "dịp", "dịp này");

        Assert.Equal(text, set.Apply(text, false));
    }

    [Fact]
    public void Apply_FindsAPhraseWhoseLettersAreHidden()
    {
        var set = CreateSet("dịp này");

        Assert.Equal("*** nó", set.Apply("d.ị.p n.à.y nó", false));
        Assert.Equal("*** nó", set.Apply("dịppp nàyyy nó", false));
    }

    [Theory]
    [InlineData("category concat scatter bobcat catalog")]
    [InlineData("Dogma dogged hotdog Bazaar Foobarbaz")]
    [InlineData("c++ và c# là hai ngôn ngữ")]
    [InlineData("a = b + c; // 1 - 2")]
    [InlineData("Giá 1.5 triệu, mã 5$ và 100%")]
    public void Apply_LeavesNormalTextAlone(string text)
    {
        var set = CreateSet("cat", "dog", "foobar", "bazqux");

        Assert.Equal(text, set.Apply(text, false));
    }

    [Theory]
    [InlineData("***")]
    [InlineData("a * b = c")]
    [InlineData("2 * 3 * 4")]
    [InlineData("**bold** and *italic*")]
    [InlineData("x*y")]
    public void Apply_DoesNotTakeStarsOrMathForAHiddenWord(string text)
    {
        var set = CreateSet("foobar", "bazqux", "cat", "đỏ");

        Assert.Equal(text, set.Apply(text, false));
    }

    [Fact]
    public void Apply_InHtml_HiddenWordsInTheTextAreFoundButTagsAndEntitiesAreKept()
    {
        var set = CreateSet("bazqux", "foobar");

        var html = "<p class=\"b4zqux\">a b4zqux &#39;f.o.o.b.a.r&#39; <a href=\"/f.o.o.b.a.r\" title=\"b.a.z.q.u.x\">f o o b a r</a>&nbsp;ok</p>";

        Assert.Equal(
            "<p class=\"b4zqux\">a *** &#39;***&#39; <a href=\"/f.o.o.b.a.r\" title=\"b.a.z.q.u.x\">***</a>&nbsp;ok</p>",
            set.Apply(html, true));
    }

    [Fact]
    public void Apply_DoesNotReadAnEntityAsPartOfAWord()
    {
        var set = CreateSet("bar", "nat");

        // "&#97;" is the letter "a" and "&#39;" holds digits; an entity must stay as it is and never join a word.
        Assert.Equal("don&#39;t &amp; it&#8217;s b&#97;r n&#97;t", set.Apply("don&#39;t &amp; it&#8217;s b&#97;r n&#97;t", true));
    }

    [Fact]
    public void Apply_AKeyWithSignsInIsOnlyFoundAsItIsWritten()
    {
        var set = CreateSet("c++");

        Assert.Equal("*** and c+ and cc", set.Apply("c++ and c+ and cc", false));
    }

    [Fact]
    public void Apply_ATextTypedWithSeparateAccentMarksIsFoundWhenHidden()
    {
        var set = CreateSet("dịp");
        var decomposed = "d.ị.p".Normalize(NormalizationForm.FormD);

        Assert.Equal("***", set.Apply(decomposed, false));
    }

    [Fact]
    public void Apply_AVeryLongTextWithManyWordsFinishesQuickly()
    {
        var words = new List<string> { "foobar", "bazqux", "cặp", "dịp", "đỏ", "đẻ" };
        words.AddRange(Enumerable.Range(1, 60).Select(number => $"zzword{number}"));
        var set = new ProfanityFilterSet(words);
        var text = string.Concat(Enumerable.Repeat("Đây là một đoạn văn bình thường nói về lập trình và cơ sở dữ liệu. ", 1500));
        var withHidden = text + " b4zqux " + text;

        var watch = System.Diagnostics.Stopwatch.StartNew();
        var result = set.Apply(withHidden, false);
        watch.Stop();

        Assert.Contains("***", result);
        Assert.DoesNotContain("b4zqux", result);
        Assert.True(watch.Elapsed < TimeSpan.FromSeconds(2), $"took {watch.Elapsed}");
    }

    // The real list is only on the computer of the owner (backend/Data/Seed/banned-words.txt, not in Git). When it is
    // there, every word of it must be found as it is, and when its letters are separated by dots; normal sentences must
    // pass. Without the file the test has nothing to check.
    [Fact]
    public void Apply_WithTheLocalList_FindsEveryWordAndLeavesNormalSentencesAlone()
    {
        var file = FindLocalList();
        if (file is null) return;

        var words = BannedWordRules.ParseLines(File.ReadAllLines(file, Encoding.UTF8));
        var set = new ProfanityFilterSet(words);

        foreach (var word in words)
        {
            Assert.Equal("x *** y", set.Apply($"x {word} y", false));
            Assert.DoesNotContain(word, set.Apply($"x {word.ToUpperInvariant()} y", false), StringComparison.OrdinalIgnoreCase);
        }

        foreach (var word in words.Where(word => EvasionPattern.CanBeHidden(EvasionPattern.Fold(word))))
        {
            var dotted = string.Join(' ', word.Split(' ').Select(part => string.Join('.', part.Select(character => character.ToString()))));
            Assert.DoesNotContain(dotted, set.Apply($"x {dotted} y", false), StringComparison.Ordinal);
        }

        var sentences = string.Join(" ",
            "Các bạn đi đâu đó? Tôi đã đụng độ lỗi này khi cài đĩa DVD vào máy.",
            "Địa chỉ ở đây: dữ liệu của đồ án được lưu trong cơ sở dữ liệu SQL Server.",
            "Hàm này trả về một mảng; hãy dùng vòng lặp for để duyệt qua từng phần tử.",
            "cac ban doc class assert, day la tieng Viet khong dau thoi.",
            "Đồ thị biểu diễn quan hệ giữa các đỉnh; độ phức tạp là O(n log n).",
            "Cú pháp: SELECT * FROM Users WHERE Id = 1; -- chọn tất cả",
            "Scunthorpe, Dickinson, Hancock, shiitake, assassin, classic và bitcoin là những từ bình thường.",
            "Chúc các bạn học tốt, đừng ngại đặt câu hỏi trên diễn đàn!");
        Assert.Equal(sentences, set.Apply(sentences, false));
    }

    private static string? FindLocalList()
    {
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            var candidate = Path.Combine(directory.FullName, "backend", "Data", "Seed", "banned-words.txt");
            if (File.Exists(candidate)) return candidate;
        }
        return null;
    }
}
