using TechForum.Api.Services;

namespace TechForum.Api.Tests.Fakes;

// Behaves as if the member has just used up the posting limits: refuses everything with the given wait.
public sealed class RefusingPostingRateLimiter(TimeSpan wait) : IPostingRateLimiter
{
    public int Calls { get; private set; }

    public bool TryAcquireTopic(string userId, out TimeSpan retryAfter) => Refuse(out retryAfter);

    public bool TryAcquireAnswer(string userId, out TimeSpan retryAfter) => Refuse(out retryAfter);

    private bool Refuse(out TimeSpan retryAfter)
    {
        Calls++;
        retryAfter = wait;
        return false;
    }
}
