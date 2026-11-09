using System.Text;
using System.Text.RegularExpressions;

namespace TechForum.Api.Services;

// The list of banned words turned into patterns, and the work of replacing them by "***" in a text.
// It does not touch the database or the cache, so it can be tested alone.
//
// A text is cleaned in two steps:
//
// 1. The words as they are written in the list.
//    - a word is found only as a whole word ("category" is not hit by a banned "cat"), whatever the case of the text;
//    - accents count: "cặp" is banned but "cap" is not, unless "cap" is in the list. Taking the accents away would
//      turn a common word into a banned one, for example the common "cáp" into the banned "cặp".
//
// 2. The words that the writer has hidden (see EvasionPattern): letters apart "f.o.o.b.a.r" or "f o o b a r", letters repeated
//    "foooobar", signs in place of letters "f0ob4r" "b@zqux", a star in place of a letter "fo*bar" "f**bar". A word is
//    only taken here when something is hidden: "cap" with no sign and no repeat is the normal way to write "cặp"
//    without accents and is left alone, and a word of two letters ("đỏ", which without accents is "do") is never
//    taken for repeating.
//
// In HTML only the text between tags is changed, never a tag, an attribute or an entity (a link or an image address
// stays as it is).
public sealed class ProfanityFilterSet
{
    public const string Mask = "***";

    // The odd pieces of a split are the tags and the entities ("&nbsp;"), which are kept as they are.
    private static readonly Regex HtmlTagOrEntity =
        new(@"(<[^>]*>|&#?[A-Za-z0-9]+;)", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex Spaces = new(@"\s+", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private const string BeforeWord = @"(?<![\p{L}\p{N}\p{M}])(?:";
    private const string AfterWord = @")(?![\p{L}\p{N}\p{M}])";

    private readonly Regex? exactPattern;
    private readonly Regex? hiddenPattern;
    // For the groups of hiddenPattern, in order: the word without accents.
    private readonly IReadOnlyList<string> hiddenWords = [];

    public ProfanityFilterSet(IEnumerable<string> words)
    {
        var normalized = words
            .Select(NormalizeWord)
            .Where(word => word.Length > 0)
            .Distinct(StringComparer.Ordinal)
            // The longest first, so "dịp này" wins over "dịp".
            .OrderByDescending(word => word.Length)
            .ToList();
        WordCount = normalized.Count;
        if (normalized.Count == 0) return;

        // Regex.Escape writes a space as "\ ": a space inside a phrase also accepts several spaces or a line break.
        var alternatives = string.Join("|", normalized.Select(word => Regex.Escape(word).Replace("\\ ", "\\s+", StringComparison.Ordinal)));
        exactPattern = CreateRegex(alternatives);

        var folded = normalized
            .Select(EvasionPattern.Fold)
            .Where(EvasionPattern.CanBeHidden)
            .Distinct(StringComparer.Ordinal)
            .OrderByDescending(word => word.Length)
            .ToList();
        if (folded.Count == 0) return;

        hiddenWords = folded;
        // One named group for each word tells the replacement which word was found.
        hiddenPattern = CreateRegex(string.Join("|", folded.Select((word, index) => $"(?<w{index}>{EvasionPattern.Build(word)})")));
    }

    public int WordCount { get; }

    // The form in which a word is saved and compared: no spaces at the ends, one space between words, lower case,
    // and one way of writing accents (the letter with its accent in one character).
    public static string NormalizeWord(string word) =>
        string.Join(' ', word.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Normalize(NormalizationForm.FormC)
            .ToLowerInvariant();

    public string Apply(string text, bool isHtml)
    {
        if (exactPattern is null || text.Length == 0) return text;
        if (!isHtml) return MaskText(text);

        // Splitting with a group keeps the tags and entities: the odd pieces are those, the even pieces are text.
        var pieces = HtmlTagOrEntity.Split(text);
        for (var index = 0; index < pieces.Length; index += 2)
        {
            pieces[index] = MaskText(pieces[index]);
        }
        return string.Concat(pieces);
    }

    private static Regex CreateRegex(string alternatives) => new(
        BeforeWord + alternatives + AfterWord,
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant,
        TimeSpan.FromSeconds(1));

    private string MaskText(string text)
    {
        if (text.Length == 0) return text;
        // A text typed with separate accent marks would not match the words, which are saved in one-character form.
        var composed = text.IsNormalized(NormalizationForm.FormC) ? text : text.Normalize(NormalizationForm.FormC);

        var masked = ReplaceSafely(exactPattern!, composed, match => Mask);
        return hiddenPattern is null ? masked : ReplaceSafely(hiddenPattern, masked, ReplaceHiddenWord);
    }

    // A text that takes too long to scan is left as it is: it is better to let one text pass than to stop a post.
    private static string ReplaceSafely(Regex pattern, string text, MatchEvaluator evaluator)
    {
        try
        {
            return pattern.Replace(text, evaluator);
        }
        catch (RegexMatchTimeoutException)
        {
            return text;
        }
    }

    private string ReplaceHiddenWord(Match match)
    {
        var word = FindWord(match);
        var written = match.Value;

        // Stars and signs alone are not a word: "***" (the mask itself) or "a * b" must stay as they are.
        if (written.Count(char.IsLetterOrDigit) < 2) return written;

        // Only letters (and the spaces of a phrase), so nothing is hidden by a sign: the word may be a normal word
        // written without accents ("cac" for "các") or with a letter repeated ("đii" for "đi").
        if (written.All(character => char.IsLetter(character) || char.IsWhiteSpace(character) ||
            char.GetUnicodeCategory(character) == System.Globalization.UnicodeCategory.NonSpacingMark))
        {
            // The same letters, only the accents are missing or different ("dip nay" for "dịp này").
            if (Spaces.Replace(EvasionPattern.Fold(written), " ") == word) return written;
            // A word of two letters is too short to tell a repeat from a normal word.
            if (word.Count(character => character != ' ') <= 2) return written;
        }
        return Mask;
    }

    private string FindWord(Match match)
    {
        for (var index = 0; index < hiddenWords.Count; index++)
        {
            if (match.Groups[$"w{index}"].Success) return hiddenWords[index];
        }
        return string.Empty;
    }
}
