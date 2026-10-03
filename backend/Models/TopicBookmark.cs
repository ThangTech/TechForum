namespace TechForum.Api.Models;

public sealed class TopicBookmark
{
    public int TopicId { get; set; }
    public Topic Topic { get; set; } = null!;
    public required string UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    public DateTimeOffset CreatedAtUtc { get; set; }
}
