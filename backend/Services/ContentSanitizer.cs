using Ganss.Xss;

namespace TechForum.Api.Services;

public sealed class ContentSanitizer : IContentSanitizer
{
    private readonly HtmlSanitizer sanitizer;

    public ContentSanitizer()
    {
        var options = new HtmlSanitizerOptions();
        options.AllowedTags.Clear();
        options.AllowedAttributes.Clear();
        options.UriAttributes.Clear();
        options.AllowedSchemes.Clear();
        AddAll(options.AllowedTags,
        [
            "p", "br", "hr", "h2", "h3", "h4", "strong", "em", "u", "s",
            "ul", "ol", "li", "blockquote", "pre", "code", "a", "span"
        ]);
        AddAll(options.AllowedAttributes,
        [
            "href", "title", "class"
        ]);
        AddAll(options.UriAttributes, ["href"]);
        AddAll(options.AllowedSchemes, ["http", "https"]);
        sanitizer = new HtmlSanitizer(options);
    }

    public string Sanitize(string html) => sanitizer.Sanitize(html);

    private static void AddAll(ISet<string> target, IEnumerable<string> values)
    {
        foreach (var value in values)
        {
            target.Add(value);
        }
    }
}
