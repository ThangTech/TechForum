namespace TechForum.Api.Models;

public sealed class Answer
{
    public int Id { get; set; }
    public int TopicId { get; set; }
    public Topic Topic { get; set; } = null!;
    public required string AuthorId { get; set; }
    public ApplicationUser Author { get; set; } = null!;
    public required string BodyHtml { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset? UpdatedAtUtc { get; set; }
    public bool IsDeleted { get; set; }
    public bool IsHiddenByModerator { get; set; }
}
