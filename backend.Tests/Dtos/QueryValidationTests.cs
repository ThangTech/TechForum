using System.ComponentModel.DataAnnotations;
using TechForum.Api.Dtos;
using Xunit;

namespace TechForum.Api.Tests.Services;

// [ApiController] trả 400 khi query sai; các test này gọi đúng bộ kiểm tra mà ASP.NET Core dùng.
public sealed class QueryValidationTests
{
    [Fact]
    public void PageQuery_AcceptsOneToFiftyItemsFromPageOne()
    {
        Assert.True(IsValid(new PageQuery()));
        Assert.False(IsValid(new PageQuery { Page = 0 }));
        Assert.False(IsValid(new PageQuery { PageSize = 0 }));
        Assert.False(IsValid(new PageQuery { PageSize = 51 }));
    }

    [Fact]
    public void Queries_KeepTheirOwnDefaultPageSize()
    {
        Assert.Equal(10, new BookmarkQuery().PageSize);
        Assert.Equal(10, new NotificationQuery().PageSize);
        Assert.Equal(10, new MyReportQuery().PageSize);
        Assert.Equal(20, new AdminReportQuery().PageSize);
        Assert.Equal("pending", new AdminReportQuery().Status);
    }

    [Theory]
    [InlineData("oldest", true)]
    [InlineData("score", true)]
    [InlineData("newest", false)]
    public void AnswerQuery_ChecksTheSort(string sort, bool valid)
    {
        Assert.Equal(valid, IsValid(new AnswerQuery { Sort = sort }));
    }

    [Fact]
    public void AnswerQuery_RefusesAnEmptyAnswerId()
    {
        Assert.False(IsValid(new AnswerQuery { AroundAnswerId = Guid.Empty }));
    }

    [Theory]
    [InlineData(null, null, true)]
    [InlineData("Locked", "member", true)]
    [InlineData("banned", null, false)]
    [InlineData(null, "owner", false)]
    public void AdminAccountQuery_ChecksStatusAndRole(string? status, string? role, bool valid)
    {
        Assert.Equal(valid, IsValid(new AdminAccountQuery { Status = status, Role = role }));
    }

    [Theory]
    [InlineData("accepted", true)]
    [InlineData("", true)]
    [InlineData("closed", false)]
    public void ReportQueries_CheckTheStatus(string status, bool valid)
    {
        Assert.Equal(valid, IsValid(new AdminReportQuery { Status = status }));
        Assert.Equal(valid, IsValid(new MyReportQuery { Status = status }));
    }

    [Fact]
    public void QuestionHighlightQuery_ChecksThePeriodAndTheLimit()
    {
        Assert.True(IsValid(new QuestionHighlightQuery()));
        Assert.False(IsValid(new QuestionHighlightQuery { PeriodDays = 6 }));
        Assert.False(IsValid(new QuestionHighlightQuery { Limit = 11 }));
    }

    private static bool IsValid(object query)
    {
        return Validator.TryValidateObject(query, new ValidationContext(query), new List<ValidationResult>(), validateAllProperties: true);
    }
}
