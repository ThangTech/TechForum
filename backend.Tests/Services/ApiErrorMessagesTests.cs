using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using TechForum.Api.Configuration;
using TechForum.Api.Filters;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class ApiErrorMessagesTests
{
    [Theory]
    [InlineData("The Title field is required.")]
    [InlineData("The Summary field is required")]
    public void Localize_ReplacesARequiredFieldMessageOfTheFramework(string message)
    {
        Assert.Equal("Vui lòng nhập đủ các thông tin bắt buộc.", ApiErrorMessages.Localize(message));
    }

    [Theory]
    [InlineData("The JSON value could not be converted to System.Int32. Path: $.value | LineNumber: 0 | BytePositionInLine: 12.")]
    [InlineData("A non-empty request body is required.")]
    [InlineData("The value 'abc' is not valid.")]
    [InlineData("Something else in English")]
    public void Localize_ReplacesAnyOtherEnglishMessageWithAGeneralVietnameseOne(string message)
    {
        Assert.Equal("Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.", ApiErrorMessages.Localize(message));
    }

    [Theory]
    [InlineData("Tiêu đề phải có từ 5 đến 150 ký tự.")]
    [InlineData("Vui lòng nhập tên hiển thị.")]
    public void Localize_KeepsAMessageThatIsAlreadyVietnamese(string message)
    {
        Assert.Equal(message, ApiErrorMessages.Localize(message));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Localize_GivesNullForAnEmptyMessage(string? message)
    {
        Assert.Null(ApiErrorMessages.Localize(message));
    }

    [Fact]
    public void Apply_GivesAVietnameseTitleAndTheFirstMessageAsDetail()
    {
        var problem = new ValidationProblemDetails(new Dictionary<string, string[]>
        {
            ["title"] = ["Tiêu đề quá ngắn."],
            ["summary"] = ["The Summary field is required."],
        });
        Assert.Equal(ApiErrorMessages.DefaultValidationTitle, problem.Title);

        ApiErrorMessages.Apply(problem);

        Assert.Equal(ApiErrorMessages.ValidationTitle, problem.Title);
        Assert.Equal("Tiêu đề quá ngắn.", problem.Detail);
        Assert.Equal("Vui lòng nhập đủ các thông tin bắt buộc.", Assert.Single(problem.Errors["summary"]));
    }

    [Fact]
    public void Apply_KeepsATitleAndADetailThatWereSet()
    {
        var problem = new ValidationProblemDetails(new Dictionary<string, string[]> { ["word"] = ["Từ cấm chưa hợp lệ."] })
        {
            Title = "Từ cấm bị trùng",
            Detail = "Từ này đã có trong danh sách."
        };

        ApiErrorMessages.Apply(problem);

        Assert.Equal("Từ cấm bị trùng", problem.Title);
        Assert.Equal("Từ này đã có trong danh sách.", problem.Detail);
    }

    [Fact]
    public void Apply_WithoutAnyMessage_GivesAGeneralDetail()
    {
        var problem = new ValidationProblemDetails(new Dictionary<string, string[]> { ["x"] = [] });

        ApiErrorMessages.Apply(problem);

        Assert.Equal(ApiErrorMessages.GenericDetail, problem.Detail);
    }

    [Fact]
    public void ClientErrorTitles_AreVietnameseForEachStatusThatAMemberMaySee()
    {
        foreach (var status in new[] { 400, 401, 403, 404, 409, 429 })
        {
            Assert.True(ApiErrorMessages.ClientErrorTitles.TryGetValue(status, out var title));
            Assert.Contains(title, text => text > 127);
        }
    }

    [Fact]
    public void Filter_ChangesAValidationProblemThatAControllerMade()
    {
        var problem = new ValidationProblemDetails(new Dictionary<string, string[]> { ["bodyHtml"] = ["Nội dung không được để trống."] });
        var context = CreateContext(new BadRequestObjectResult(problem));

        new ValidationProblemMessageFilter().OnResultExecuting(context);

        Assert.Equal(ApiErrorMessages.ValidationTitle, problem.Title);
        Assert.Equal("Nội dung không được để trống.", problem.Detail);
    }

    [Fact]
    public void Filter_LeavesOtherAnswersAlone()
    {
        var problem = new ProblemDetails { Title = "Not Found" };
        var context = CreateContext(new NotFoundObjectResult(problem));

        new ValidationProblemMessageFilter().OnResultExecuting(context);

        Assert.Equal("Not Found", problem.Title);
        Assert.Null(problem.Detail);
    }

    private static ResultExecutingContext CreateContext(IActionResult result) => new(
        new ActionContext(new DefaultHttpContext(), new RouteData(), new ActionDescriptor()),
        new List<IFilterMetadata>(),
        result,
        controller: new object());
}
