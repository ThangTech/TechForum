namespace TechForum.Api.Models;

public sealed class Answer
{
    public Guid Id { get; set; }
    public Guid TopicId { get; set; }
    public Topic Topic { get; set; } = null!;
    public Guid? ParentAnswerId { get; set; }
    public Answer? ParentAnswer { get; set; }
    public required string AuthorId { get; set; }
    public ApplicationUser Author { get; set; } = null!;
    public required string BodyHtml { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset? UpdatedAtUtc { get; set; }
    public bool IsDeleted { get; set; }
    public bool IsHiddenByModerator { get; set; }
    // The sum of the votes (+1 and -1) of the members. Kept in step with the table of votes in one transaction.
    public int Score { get; set; }
    public ICollection<AnswerHelpfulVote> HelpfulVotes { get; set; } = new List<AnswerHelpfulVote>();
}
