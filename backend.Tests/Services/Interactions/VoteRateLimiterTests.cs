using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class VoteRateLimiterTests
{
    private static VoteRateLimiter Create(int perMinute, int perDay) =>
        new(Options.Create(new VoteLimitOptions { PerMinute = perMinute, PerDay = perDay }));

    [Fact]
    public void TryAcquire_AllowsVotesUpToTheLimitOfAMinuteAndThenRefuses()
    {
        using var limiter = Create(3, 100);

        Assert.True(limiter.TryAcquire("member", out _));
        Assert.True(limiter.TryAcquire("member", out _));
        Assert.True(limiter.TryAcquire("member", out _));
        Assert.False(limiter.TryAcquire("member", out var retryAfter));

        // Thời gian chờ là thời gian thật tới lúc cửa sổ mở lại, không phải ước đoán.
        Assert.True(retryAfter > TimeSpan.FromSeconds(50) && retryAfter <= TimeSpan.FromMinutes(1), retryAfter.ToString());
    }

    [Fact]
    public void TryAcquire_RefusesWhenTheLimitOfTheDayIsUsed_EvenIfTheMinuteIsFree()
    {
        using var limiter = Create(100, 2);

        Assert.True(limiter.TryAcquire("member", out _));
        Assert.True(limiter.TryAcquire("member", out _));
        Assert.False(limiter.TryAcquire("member", out var retryAfter));

        // Thời gian chờ tính theo ngày chứ không theo phút.
        Assert.True(retryAfter > TimeSpan.FromHours(23) && retryAfter <= TimeSpan.FromDays(1), retryAfter.ToString());
    }

    [Fact]
    public void TryAcquire_CountsEachMemberAlone()
    {
        using var limiter = Create(2, 100);

        Assert.True(limiter.TryAcquire("a", out _));
        Assert.True(limiter.TryAcquire("a", out _));
        Assert.False(limiter.TryAcquire("a", out _));

        Assert.True(limiter.TryAcquire("b", out _));
    }

    [Fact]
    public void TryAcquire_AVoteRefusedByTheMinuteGivesAShortWait_NotTheWaitOfTheDay()
    {
        using var limiter = Create(2, 4);
        Assert.True(limiter.TryAcquire("member", out _));
        Assert.True(limiter.TryAcquire("member", out _));

        // Giới hạn phút chặn đợt dồn dập nên chỉ phải chờ khoảng một phút, không phải một ngày;
        // giới hạn ngày chỉ được hỏi sau khi giới hạn phút cho qua.
        for (var attempt = 0; attempt < 20; attempt++)
        {
            Assert.False(limiter.TryAcquire("member", out var retryAfter));
            Assert.True(retryAfter <= TimeSpan.FromMinutes(1), retryAfter.ToString());
        }
    }

    [Fact]
    public void TryAcquire_AZeroOrNegativeLimitStillLetsOneVotePass()
    {
        using var limiter = Create(0, 0);

        Assert.True(limiter.TryAcquire("member", out _));
        Assert.False(limiter.TryAcquire("member", out _));
    }
}
