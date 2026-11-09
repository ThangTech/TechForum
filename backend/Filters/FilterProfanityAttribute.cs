namespace TechForum.Api.Filters;

// Marks a text of a request (the title, the summary, the body of a post or an answer) that [ProfanityFilter] must clean.
// On a record, write it as [property: FilterProfanity].
[AttributeUsage(AttributeTargets.Property)]
public sealed class FilterProfanityAttribute : Attribute
{
    // True when the text is HTML: the words are replaced only in the text, not in tags or attributes.
    public bool IsHtml { get; init; }
}
