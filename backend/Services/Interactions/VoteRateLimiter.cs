using System.Threading.RateLimiting;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;

namespace TechForum.Api.Services;

// Two limits for each member, kept in memory: a short one against a burst and a long one against a day of voting.
// The counts start again when the application restarts; this is enough to stop a script, which is the purpose.
public sealed class VoteRateLimiter : IVoteRateLimiter, IDisposable
{
    private readonly PartitionedRateLimiter<string> perMinute;
    private readonly PartitionedRateLimiter<string> perDay;

    public VoteRateLimiter(IOptions<VoteLimitOptions> options)
    {
        var limits = options.Value;
        perMinute = Create(limits.PerMinute, TimeSpan.FromMinutes(1));
        perDay = Create(limits.PerDay, TimeSpan.FromDays(1));
    }

    public bool TryAcquire(string userId, out TimeSpan retryAfter)
    {
        retryAfter = TimeSpan.Zero;

        // The short limit is asked first. A burst of refused votes then only uses places of the short limit, which come
        // back in a minute; if the long limit were asked first, one burst would use up the votes of the whole day.
        using var minuteLease = perMinute.AttemptAcquire(userId);
        if (!minuteLease.IsAcquired)
        {
            retryAfter = GetRetryAfter(minuteLease, TimeSpan.FromSeconds(10));
            return false;
        }

        using var dayLease = perDay.AttemptAcquire(userId);
        if (!dayLease.IsAcquired)
        {
            retryAfter = GetRetryAfter(dayLease, TimeSpan.FromHours(1));
            return false;
        }

        return true;
    }

    public void Dispose()
    {
        perMinute.Dispose();
        perDay.Dispose();
    }

    // A fixed window tells exactly how long until it starts again (the sliding window does not), so the member is told
    // the true time to wait.
    private static PartitionedRateLimiter<string> Create(int limit, TimeSpan window) =>
        PartitionedRateLimiter.Create<string, string>(userId => RateLimitPartition.GetFixedWindowLimiter(
            userId,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = Math.Max(1, limit),
                Window = window,
                QueueLimit = 0
            }));

    private static TimeSpan GetRetryAfter(RateLimitLease lease, TimeSpan fallback) =>
        lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter) ? retryAfter : fallback;
}
