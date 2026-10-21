namespace TechForum.Api.Models;

public sealed class AnswerHelpfulVote
{
    public int AnswerId { get; set; }
    public Answer Answer { get; set; } = null!;
    public required string UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    public DateTimeOffset CreatedAtUtc { get; set; }
}
