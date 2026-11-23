using System.Threading.RateLimiting;

namespace TechForum.Api.Services;

// The pieces shared by the limits that count what each member does (votes, new topics, new answers). The counts are kept
// in memory and start again when the application restarts; this is enough to stop a script, which is the purpose.
public static class MemberRateLimit
{
    // A fixed window tells exactly how long until it starts again (the sliding window does not), so the member is told
    // the true time to wait.
    public static PartitionedRateLimiter<string> Create(int limit, TimeSpan window) =>
        PartitionedRateLimiter.Create<string, string>(userId => RateLimitPartition.GetFixedWindowLimiter(
            userId,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = Math.Max(1, limit),
                Window = window,
                QueueLimit = 0
            }));

    // True when the member may act now (the action is counted). Otherwise false and retryAfter says how long to wait.
    public static bool TryAcquire(PartitionedRateLimiter<string> limiter, string userId, TimeSpan fallback, out TimeSpan retryAfter)
    {
        using var lease = limiter.AttemptAcquire(userId);
        retryAfter = lease.IsAcquired
            ? TimeSpan.Zero
            : lease.TryGetMetadata(MetadataName.RetryAfter, out var wait) ? wait : fallback;
        return lease.IsAcquired;
    }

    // Whole seconds, at least 1, for the Retry-After header and the message.
    public static int ToSeconds(TimeSpan retryAfter) => Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds));

    // "30 giây", "5 phút", "2 giờ": a wait is told in the unit that a person can use.
    public static string FormatWait(int seconds) => seconds switch
    {
        < 90 => $"{seconds} giây",
        < 5400 => $"{(int)Math.Ceiling(seconds / 60.0)} phút",
        _ => $"{(int)Math.Ceiling(seconds / 3600.0)} giờ"
    };
}
