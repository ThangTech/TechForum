using System.Globalization;
using System.Text;

namespace TechForum.Api.Services;

// Builds the pieces of the pattern that finds a banned word even when the writer hides it:
//   "f.o.o.b.a.r", "f o o b a r"   letters apart (a dot, a dash, an underscore or a space between them)
//   "foooobar", "dịppp"            letters repeated
//   "f0ob4r", "b@zqux"             a sign or a digit in place of a letter
//   "fo*bar", "f**bar"              a star in place of a letter (the filter wants at least two real characters)
// The word is first written without accents and in lower case ("dịp" becomes "dip"); every letter of it then becomes
// a class that also takes the accented letters, the look-alike signs and repeats.
public static class EvasionPattern
{
    // Look-alike signs. A letter may be written with them instead.
    private static readonly Dictionary<char, string> LookAlikes = new()
    {
        ['a'] = "@4", ['b'] = "8", ['e'] = "3", ['g'] = "9", ['i'] = "1!|", ['l'] = "1|", ['o'] = "0", ['s'] = "5$", ['t'] = "7+",
    };

    // Every letter with accents that gives a plain letter once the accents are taken off (á, ả, ã, ạ, ă, â, ... and đ).
    private static readonly Dictionary<char, string> AccentedLetters = BuildAccentedLetters();

    // The word without accents and in lower case. "đ" has no accent mark to remove, so it is changed by hand.
    public static string Fold(string text)
    {
        var decomposed = text.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        foreach (var character in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) == UnicodeCategory.NonSpacingMark) continue;
            builder.Append(character is 'đ' or 'Đ' ? 'd' : char.ToLowerInvariant(character));
        }
        return builder.ToString();
    }

    // True when the folded word has only the letters a-z and single spaces; other words are only found as written.
    public static bool CanBeHidden(string foldedWord) =>
        foldedWord.Count(character => character is >= 'a' and <= 'z') >= 2 &&
        foldedWord.All(character => character is >= 'a' and <= 'z' or ' ');

    public static string Build(string foldedWord)
    {
        var letterCount = foldedWord.Count(character => character != ' ');
        // A short word ("đỏ") is only found with a sign between its letters, never with spaces: "đ ỏ" is too common
        // in normal text.
        var between = letterCount >= 3 ? @"[\s._\-]{0,2}" : @"[._\-]?";
        const string betweenWords = @"[\s._\-]{1,3}";

        var pattern = new StringBuilder();
        var previousWasLetter = false;
        foreach (var character in foldedWord)
        {
            if (character == ' ')
            {
                pattern.Append(betweenWords);
                previousWasLetter = false;
                continue;
            }

            if (previousWasLetter) pattern.Append(between);
            pattern.Append(LetterClass(character)).Append('+');
            previousWasLetter = true;
        }
        return pattern.ToString();
    }

    private static string LetterClass(char letter)
    {
        var members = new StringBuilder();
        members.Append(letter);
        if (AccentedLetters.TryGetValue(letter, out var accented)) members.Append(accented);
        if (LookAlikes.TryGetValue(letter, out var signs)) members.Append(signs);
        members.Append('*');

        // Letters stay as they are; a sign is written with a backslash so it cannot change the meaning of the class.
        var escaped = new StringBuilder("[");
        foreach (var member in members.ToString())
        {
            if (!char.IsLetterOrDigit(member)) escaped.Append('\\');
            escaped.Append(member);
        }
        return escaped.Append(']').ToString();
    }

    private static Dictionary<char, string> BuildAccentedLetters()
    {
        var letters = new Dictionary<char, StringBuilder>();
        void Add(char plain, char accented)
        {
            if (!letters.TryGetValue(plain, out var list)) letters[plain] = list = new StringBuilder();
            if (!list.ToString().Contains(accented)) list.Append(accented);
        }

        // Latin-1 Supplement, Latin Extended-A and B, and Latin Extended Additional (all Vietnamese letters are there).
        for (var code = 0x00C0; code <= 0x1EF9; code++)
        {
            var character = (char)code;
            if (!char.IsLetter(character)) continue;
            var folded = Fold(character.ToString());
            if (folded.Length == 1 && folded[0] is >= 'a' and <= 'z' && folded[0] != character) Add(folded[0], character);
        }
        return letters.ToDictionary(item => item.Key, item => item.Value.ToString());
    }
}
