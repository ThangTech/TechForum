namespace TechForum.Api.Models;

public sealed class UserFollow
{
    public required string FollowerId { get; set; }
    public ApplicationUser Follower { get; set; } = null!;
    public required string FollowingId { get; set; }
    public ApplicationUser Following { get; set; } = null!;
    public DateTimeOffset CreatedAtUtc { get; set; }
}
