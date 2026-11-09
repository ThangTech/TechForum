using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public enum VoteFailure
{
    None,
    // The post or answer does not exist or cannot be seen by everyone.
    NotFound,
    // A member cannot vote for their own post or answer.
    OwnContent,
    // The value is not 1, -1 or 0.
    InvalidValue,
    // The account is younger than the minimum age for voting (see VoteLimitOptions).
    AccountTooNew,
    // The member sent votes faster than the limits allow.
    RateLimited
}

// DaysLeft: for AccountTooNew, about how many days until the member can vote. RetryAfterSeconds: for RateLimited.
public sealed record VoteResult(VoteFailure Failure, VoteDto? Vote, int DaysLeft = 0, int RetryAfterSeconds = 0)
{
    public static VoteResult Success(VoteDto vote) => new(VoteFailure.None, vote);

    public static VoteResult Failed(VoteFailure failure) => new(failure, null);

    public static VoteResult TooNew(int daysLeft) => new(VoteFailure.AccountTooNew, null, DaysLeft: daysLeft);

    public static VoteResult Limited(int retryAfterSeconds) => new(VoteFailure.RateLimited, null, RetryAfterSeconds: retryAfterSeconds);
}

public interface IVoteService
{
    // The score of a post and the vote of the member who asks (a guest has none). Null when the post cannot be seen.
    Task<VoteDto?> GetTopicVoteAsync(int topicId, string? viewerId, CancellationToken cancellationToken);

    // value: 1 = upvote, -1 = downvote, 0 = take the vote back. The same value sent again changes nothing.
    Task<VoteResult> SetTopicVoteAsync(int topicId, string userId, int value, CancellationToken cancellationToken);

    Task<VoteResult> SetAnswerVoteAsync(int topicId, int answerId, string userId, int value, CancellationToken cancellationToken);
}
