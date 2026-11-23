namespace TechForum.Api.Services;

// Trang quản trị và danh sách đầu tiên (file trên máy) dùng chung quy tắc này.
public static class BannedWordRules
{
    public const int MinLength = 2;
    public const int MaxLength = 60;

    public const string InvalidMessage = "Từ cấm phải có từ 2 đến 60 ký tự, có chữ hoặc số và không chứa dấu < hoặc >.";

    public static bool TryNormalize(string? raw, out string word)
    {
        word = ProfanityFilterSet.NormalizeWord(raw ?? string.Empty);
        return word.Length >= MinLength && word.Length <= MaxLength &&
               word.Any(char.IsLetterOrDigit) &&
               !word.Any(character => character is '<' or '>' || char.IsControl(character));
    }

    // Mỗi dòng một từ hoặc cụm từ; dòng bắt đầu bằng # là ghi chú; bỏ dòng trống, từ không hợp lệ và từ trùng.
    public static IReadOnlyList<string> ParseLines(IEnumerable<string> lines)
    {
        return lines
            .Select(line => line.Trim())
            .Where(line => line.Length > 0 && !line.StartsWith('#'))
            .Select(line => TryNormalize(line, out var word) ? word : null)
            .OfType<string>()
            .Distinct(StringComparer.Ordinal)
            .ToList();
    }
}
