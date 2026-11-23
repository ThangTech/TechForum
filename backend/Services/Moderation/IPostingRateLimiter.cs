namespace TechForum.Api.Services;

// Counts the topics and answers that each member publishes, so nobody can post faster than a person would.
public interface IPostingRateLimiter
{
    // True when the member may publish a topic now (it is counted). Otherwise false and retryAfter says how long to wait.
    bool TryAcquireTopic(string userId, out TimeSpan retryAfter);

    // The same for an answer or a reply.
    bool TryAcquireAnswer(string userId, out TimeSpan retryAfter);
}
