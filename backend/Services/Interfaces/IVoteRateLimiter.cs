namespace TechForum.Api.Services;

// Counts the votes of each member, so nobody can send them faster than a person would.
public interface IVoteRateLimiter
{
    // True when the member may vote now (the vote is counted). Otherwise false and retryAfter says how long to wait.
    bool TryAcquire(string userId, out TimeSpan retryAfter);
}
