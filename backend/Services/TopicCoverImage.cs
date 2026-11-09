using System.Text.RegularExpressions;

namespace TechForum.Api.Services;

// The cover picture of a topic is the first picture inside its body.
public static partial class TopicCoverImage
{
    public const int MaxLength = 300;

    // The sanitizer only lets pictures of the site through (src starts with /media/images/) and writes the
    // attribute with double quotes, so this pattern finds exactly those pictures.
    [GeneratedRegex(@"<img\b[^>]*?\bsrc=""(/media/images/[^""]+)""", RegexOptions.IgnoreCase)]
    private static partial Regex FirstImage();

    // Returns the address of the first picture of the (already sanitized) body, or null when there is none.
    public static string? Extract(string sanitizedBodyHtml)
    {
        var match = FirstImage().Match(sanitizedBodyHtml);
        return match.Success && match.Groups[1].Length <= MaxLength ? match.Groups[1].Value : null;
    }
}
