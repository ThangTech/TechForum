namespace TechForum.Api.Models;

public sealed class UserSkill
{
    public required string UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    public Guid TagId { get; set; }
    public Tag Tag { get; set; } = null!;
    public DateTimeOffset CreatedAtUtc { get; set; }
}
