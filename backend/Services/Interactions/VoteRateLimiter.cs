using System.Threading.RateLimiting;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;

namespace TechForum.Api.Services;

// Giới hạn ngắn chống bình chọn dồn dập, giới hạn dài cho cả ngày.
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
        // Hỏi giới hạn ngắn trước: một đợt bị từ chối chỉ tốn chỗ của giới hạn phút (mở lại sau một phút);
        // hỏi giới hạn ngày trước thì một đợt sẽ dùng hết lượt của cả ngày.
        return MemberRateLimit.TryAcquire(perMinute, userId, TimeSpan.FromSeconds(10), out retryAfter) &&
            MemberRateLimit.TryAcquire(perDay, userId, TimeSpan.FromHours(1), out retryAfter);
    }

    public void Dispose()
    {
        perMinute.Dispose();
        perDay.Dispose();
    }
}
