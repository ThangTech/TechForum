using TechForum.Api.Enums;

namespace TechForum.Api.Data.Repositories;

// What a vote does, decided by the service. NewValue is 1, -1 or 0 (take the vote back).
public sealed record VoteCommand(
    string VoterId,
    VoteTargetType TargetType,
    Guid TargetId,
    string AuthorId,
    int NewValue,
    DateTimeOffset NowUtc);

// PreviousValue and NewValue are the vote of the member before and after; Score is the score of the target after.
public sealed record VoteOutcome(int PreviousValue, int NewValue, int Score);

public interface IVoteRepository
{
    // Saves the vote, changes the score of the post or answer, the reputation of its author and (for a downvote) the
    // reputation of the voter. All of it happens in one transaction: if one step fails, none is kept.
    Task<VoteOutcome> ApplyAsync(VoteCommand command, CancellationToken cancellationToken);

    Task<int> GetMyVoteAsync(string userId, VoteTargetType targetType, Guid targetId, CancellationToken cancellationToken);
}
