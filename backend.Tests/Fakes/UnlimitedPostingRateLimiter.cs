using TechForum.Api.Services;

namespace TechForum.Api.Tests.Fakes;

// Lets every topic and answer through, for tests that are not about the posting limits.
public sealed class UnlimitedPostingRateLimiter : IPostingRateLimiter
{
    public bool TryAcquireTopic(string userId, out TimeSpan retryAfter)
    {
        retryAfter = TimeSpan.Zero;
        return true;
    }

    public bool TryAcquireAnswer(string userId, out TimeSpan retryAfter)
    {
        retryAfter = TimeSpan.Zero;
        return true;
    }
}
