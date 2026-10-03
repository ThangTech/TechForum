namespace TechForum.Api.Models;

public sealed class Notification
{
    public long Id { get; set; }
    public required string UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    public required string Type { get; set; }
    public required string Title { get; set; }
    public required string Message { get; set; }
    public required string Link { get; set; }
    public required string SourceKey { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset? ReadAtUtc { get; set; }
}
