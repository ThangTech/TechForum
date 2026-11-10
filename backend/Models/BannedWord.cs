namespace TechForum.Api.Models;

// A word or short phrase that is not allowed in posts and answers. It is stored in lower case; the filter ignores
// the case of the text but not its accents (so "các" is not mistaken for a word without accents).
public sealed class BannedWord
{
    public Guid Id { get; set; }
    public required string Word { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
}
