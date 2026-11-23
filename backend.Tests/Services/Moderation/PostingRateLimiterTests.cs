using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class PostingRateLimiterTests
{
    private static PostingRateLimiter Create(int topicIntervalSeconds = 30, int answersPerMinute = 5) =>
        new(Options.Create(new PostingLimitOptions
        {
            TopicIntervalSeconds = topicIntervalSeconds,
            AnswersPerMinute = answersPerMinute
        }));

    [Fact]
    public void TryAcquireTopic_AllowsOneTopicAndThenAsksToWaitForTheRestOfTheInterval()
    {
        using var limiter = Create(topicIntervalSeconds: 30);

        Assert.True(limiter.TryAcquireTopic("member", out _));
        Assert.False(limiter.TryAcquireTopic("member", out var retryAfter));

        Assert.True(retryAfter > TimeSpan.FromSeconds(25) && retryAfter <= TimeSpan.FromSeconds(30), retryAfter.ToString());
    }

    [Fact]
    public void TryAcquireAnswer_AllowsTheAnswersOfAMinuteAndThenRefuses()
    {
        using var limiter = Create(answersPerMinute: 3);

        Assert.True(limiter.TryAcquireAnswer("member", out _));
        Assert.True(limiter.TryAcquireAnswer("member", out _));
        Assert.True(limiter.TryAcquireAnswer("member", out _));
        Assert.False(limiter.TryAcquireAnswer("member", out var retryAfter));

        Assert.True(retryAfter > TimeSpan.FromSeconds(50) && retryAfter <= TimeSpan.FromMinutes(1), retryAfter.ToString());
    }

    [Fact]
    public void Limits_AreCountedForEachMemberAndEachKindApart()
    {
        using var limiter = Create(topicIntervalSeconds: 30, answersPerMinute: 1);

        Assert.True(limiter.TryAcquireTopic("member", out _));
        // Người khác không bị chậm lại vì người thứ nhất.
        Assert.True(limiter.TryAcquireTopic("other", out _));
        // Đăng bài không làm hết lượt trả lời.
        Assert.True(limiter.TryAcquireAnswer("member", out _));
    }

    [Theory]
    [InlineData(1, "1 giây")]
    [InlineData(45, "45 giây")]
    [InlineData(120, "2 phút")]
    [InlineData(7200, "2 giờ")]
    public void FormatWait_TellsTheWaitInAUnitAPersonCanUse(int seconds, string expected)
    {
        Assert.Equal(expected, MemberRateLimit.FormatWait(seconds));
    }
}
