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

        // The wait is the real time until the window starts again, not a guess.
        Assert.True(retryAfter > TimeSpan.FromSeconds(50) && retryAfter <= TimeSpan.FromMinutes(1), retryAfter.ToString());
    }

    [Fact]
    public void TryAcquire_RefusesWhenTheLimitOfTheDayIsUsed_EvenIfTheMinuteIsFree()
    {
        using var limiter = Create(100, 2);

        Assert.True(limiter.TryAcquire("member", out _));
        Assert.True(limiter.TryAcquire("member", out _));
        Assert.False(limiter.TryAcquire("member", out var retryAfter));

        // The wait is about the day, not about the minute.
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

        // A burst is refused by the short limit, so the member is told to wait about a minute, not a day. (The day
        // limit is only asked after the minute accepts, so a burst does not use up the votes of the day.)
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
