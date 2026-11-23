using System.Threading.RateLimiting;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;

namespace TechForum.Api.Services;

public sealed class PostingRateLimiter : IPostingRateLimiter, IDisposable
{
    private readonly PartitionedRateLimiter<string> topics;
    private readonly PartitionedRateLimiter<string> answers;

    public PostingRateLimiter(IOptions<PostingLimitOptions> options)
    {
        var limits = options.Value;
        topics = MemberRateLimit.Create(1, TimeSpan.FromSeconds(Math.Max(1, limits.TopicIntervalSeconds)));
        answers = MemberRateLimit.Create(limits.AnswersPerMinute, TimeSpan.FromMinutes(1));
    }

    public bool TryAcquireTopic(string userId, out TimeSpan retryAfter) =>
        MemberRateLimit.TryAcquire(topics, userId, TimeSpan.FromSeconds(30), out retryAfter);

    public bool TryAcquireAnswer(string userId, out TimeSpan retryAfter) =>
        MemberRateLimit.TryAcquire(answers, userId, TimeSpan.FromSeconds(10), out retryAfter);

    public void Dispose()
    {
        topics.Dispose();
        answers.Dispose();
    }
}
