using System.Threading.RateLimiting;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;

namespace TechForum.Api.Services;

// Two limits for each member: a short one against a burst and a long one against a day of voting.
public sealed class VoteRateLimiter : IVoteRateLimiter, IDisposable
{
    private readonly PartitionedRateLimiter<string> perMinute;
    private readonly PartitionedRateLimiter<string> perDay;

    public VoteRateLimiter(IOptions<VoteLimitOptions> options)
    {
        var limits = options.Value;
        perMinute = MemberRateLimit.Create(limits.PerMinute, TimeSpan.FromMinutes(1));
        perDay = MemberRateLimit.Create(limits.PerDay, TimeSpan.FromDays(1));
    }

    public bool TryAcquire(string userId, out TimeSpan retryAfter)
    {
        // The short limit is asked first. A burst of refused votes then only uses places of the short limit, which come
        // back in a minute; if the long limit were asked first, one burst would use up the votes of the whole day.
        return MemberRateLimit.TryAcquire(perMinute, userId, TimeSpan.FromSeconds(10), out retryAfter) &&
            MemberRateLimit.TryAcquire(perDay, userId, TimeSpan.FromHours(1), out retryAfter);
    }

    public void Dispose()
    {
        perMinute.Dispose();
        perDay.Dispose();
    }
}
