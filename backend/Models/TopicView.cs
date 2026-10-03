namespace TechForum.Api.Models;

public sealed class TopicView
{
    public int TopicId { get; set; }
    public Topic Topic { get; set; } = null!;
    public required string VisitorKeyHash { get; set; }
    public DateOnly ViewedOnUtc { get; set; }
    public DateTimeOffset FirstViewedAtUtc { get; set; }
}
