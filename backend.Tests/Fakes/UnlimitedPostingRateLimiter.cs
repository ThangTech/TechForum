using TechForum.Api.Services;

namespace TechForum.Api.Tests.Fakes;

// Cho qua mọi bài và câu trả lời, dùng cho test không liên quan tới giới hạn đăng bài.
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
