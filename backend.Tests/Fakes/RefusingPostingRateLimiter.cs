using TechForum.Api.Services;

namespace TechForum.Api.Tests.Fakes;

// Giả lập thành viên vừa dùng hết lượt đăng bài: từ chối mọi yêu cầu với thời gian chờ đã cho.
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
