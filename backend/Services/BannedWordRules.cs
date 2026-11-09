namespace TechForum.Api.Services;

// What a banned word may look like. The admin page and the first list (the local file) follow the same rules.
public static class BannedWordRules
{
    public const int MinLength = 2;
    public const int MaxLength = 60;

    public const string InvalidMessage = "Từ cấm phải có từ 2 đến 60 ký tự, có chữ hoặc số và không chứa dấu < hoặc >.";

    // Gives the word in the form it is saved in (see ProfanityFilterSet.NormalizeWord), or false when it is not allowed.
    public static bool TryNormalize(string? raw, out string word)
    {
        word = ProfanityFilterSet.NormalizeWord(raw ?? string.Empty);
        return word.Length is >= MinLength and <= MaxLength &&
               word.Any(char.IsLetterOrDigit) &&
               !word.Any(character => character is '<' or '>' || char.IsControl(character));
    }

    // The lines of the local list: one word or phrase on a line; a line that starts with # is a note; blank lines and
    // words that are not allowed are skipped; a word that comes twice is kept once.
    public static IReadOnlyList<string> ParseLines(IEnumerable<string> lines) =>
        lines
            .Select(line => line.Trim())
            .Where(line => line.Length > 0 && !line.StartsWith('#'))
            .Select(line => TryNormalize(line, out var word) ? word : null)
            .OfType<string>()
            .Distinct(StringComparer.Ordinal)
            .ToList();
}
