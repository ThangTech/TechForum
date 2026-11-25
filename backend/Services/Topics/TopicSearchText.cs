using System.Globalization;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;

namespace TechForum.Api.Services;

// Văn bản dùng để tìm kiếm: bỏ thẻ HTML, bỏ dấu tiếng Việt (cả đ → d), viết thường, gộp khoảng trắng.
// Nhờ vậy gõ "lap trinh" vẫn tìm thấy "Lập trình", và tìm được cả trong nội dung bài.
public static partial class TopicSearchText
{
    // Đủ cho tìm kiếm; phần đuôi của bài rất dài ít khi cần tìm và chỉ làm cột phình to.
    private const int MaxLength = 20_000;
    private const int MaxWords = 6;

    public static string Build(string title, string summary, string bodyHtml)
    {
        var body = WebUtility.HtmlDecode(HtmlTag().Replace(bodyHtml, " "));
        var text = Normalize($"{title} {summary} {body}");
        return text.Length > MaxLength ? text[..MaxLength] : text;
    }

    // Các từ của từ khóa, đã chuẩn hoá giống văn bản tìm kiếm. Bài phải chứa đủ mọi từ.
    public static IReadOnlyList<string> Words(string? keyword)
    {
        if (string.IsNullOrWhiteSpace(keyword))
        {
            return [];
        }
        return Normalize(keyword)
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Distinct()
            .Take(MaxWords)
            .ToList();
    }

    public static string Normalize(string value)
    {
        var decomposed = value.ToLowerInvariant().Replace('đ', 'd').Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        foreach (var character in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }
        return Whitespace().Replace(builder.ToString().Normalize(NormalizationForm.FormC), " ").Trim();
    }

    [GeneratedRegex("<[^>]+>", RegexOptions.CultureInvariant)]
    private static partial Regex HtmlTag();

    [GeneratedRegex(@"\s+", RegexOptions.CultureInvariant)]
    private static partial Regex Whitespace();
}
