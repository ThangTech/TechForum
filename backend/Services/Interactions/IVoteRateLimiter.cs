namespace TechForum.Api.Services;

public interface IVoteRateLimiter
{
    // False kèm retryAfter là thời gian phải chờ.
    bool TryAcquire(string userId, out TimeSpan retryAfter);
}
