namespace TechForum.Api.Models;

public sealed class TopicTag
{
    public Guid TopicId { get; set; }
    public Topic Topic { get; set; } = null!;
    public Guid TagId { get; set; }
    public Tag Tag { get; set; } = null!;
}
