using TechForum.Api.Data.Repositories;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class TopRangeTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 20, 12, 0, 0, TimeSpan.Zero);

    [Theory]
    [InlineData("day", 1)]
    [InlineData("DAY", 1)]
    [InlineData("week", 7)]
    [InlineData("month", 30)]
    public void GetTopSince_GivesTheStartOfTheChosenTime(string range, int days)
    {
        Assert.Equal(Now.AddDays(-days), TopicRepository.GetTopSince(range, Now));
    }

    [Theory]
    [InlineData("all")]
    [InlineData("ALL")]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("year")]
    public void GetTopSince_GivesNullForEveryTime(string? range)
    {
        Assert.Null(TopicRepository.GetTopSince(range, Now));
    }
}
