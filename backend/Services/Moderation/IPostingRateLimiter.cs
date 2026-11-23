namespace TechForum.Api.Services;

public interface IPostingRateLimiter
{
    // False kèm retryAfter là thời gian phải chờ.
    bool TryAcquireTopic(string userId, out TimeSpan retryAfter);

    bool TryAcquireAnswer(string userId, out TimeSpan retryAfter);
}
