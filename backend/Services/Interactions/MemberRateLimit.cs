using System.Threading.RateLimiting;

namespace TechForum.Api.Services;

// Dùng chung cho giới hạn bình chọn, đăng bài và trả lời. Bộ đếm nằm trong bộ nhớ và bắt đầu lại khi khởi động lại;
// như vậy đủ để chặn script, đó là mục đích.
public static class MemberRateLimit
{
    // Cửa sổ cố định biết chính xác lúc nào mở lại (cửa sổ trượt thì không), nên báo đúng thời gian phải chờ.
    public static PartitionedRateLimiter<string> Create(int limit, TimeSpan window)
    {
        return PartitionedRateLimiter.Create<string, string>(userId => RateLimitPartition.GetFixedWindowLimiter(
            userId,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = Math.Max(1, limit),
                Window = window,
                QueueLimit = 0
            }));
    }

    public static bool TryAcquire(PartitionedRateLimiter<string> limiter, string userId, TimeSpan fallback, out TimeSpan retryAfter)
    {
        using var lease = limiter.AttemptAcquire(userId);
        retryAfter = lease.IsAcquired
            ? TimeSpan.Zero
            : lease.TryGetMetadata(MetadataName.RetryAfter, out var wait) ? wait : fallback;
        return lease.IsAcquired;
    }

    // Số giây nguyên, ít nhất 1, cho header Retry-After và câu thông báo.
    public static int ToSeconds(TimeSpan retryAfter) => Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds));

    // "30 giây", "5 phút", "2 giờ": a wait is told in the unit that a person can use.
    public static string FormatWait(int seconds)
    {
        if (seconds < 90)
        {
            return $"{seconds} giây";
        }
        if (seconds < 5400)
        {
            return $"{(int)Math.Ceiling(seconds / 60.0)} phút";
        }

        return $"{(int)Math.Ceiling(seconds / 3600.0)} giờ";
    }
}
