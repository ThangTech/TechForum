using TechForum.Api.Enums;

namespace TechForum.Api.Models;

// One vote of a member for a post or an answer: +1 (upvote) or -1 (downvote). A member has at most one vote for each
// target (the primary key), so the same vote cannot be counted twice. A member who takes the vote back has no row.
// The target is a post or an answer, so there is no foreign key to it; the service checks that it exists.
public sealed class UserVote
{
    public required string UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    public VoteTargetType TargetType { get; set; }
    public Guid TargetId { get; set; }
    public int Value { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset? UpdatedAtUtc { get; set; }
}
