namespace TechForum.Api.Models;

// A skill that a member chose for their own profile. It is always one of the tags that already exist.
public sealed class UserSkill
{
    public required string UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    public Guid TagId { get; set; }
    public Tag Tag { get; set; } = null!;
    public DateTimeOffset CreatedAtUtc { get; set; }
}
