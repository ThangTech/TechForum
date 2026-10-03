namespace TechForum.Api.Models;

public sealed class TopicTag
{
    public int TopicId { get; set; }
    public Topic Topic { get; set; } = null!;
    public int TagId { get; set; }
    public Tag Tag { get; set; } = null!;
}
