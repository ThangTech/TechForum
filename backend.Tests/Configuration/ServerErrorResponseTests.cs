using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using TechForum.Api.Configuration;
using Xunit;

namespace TechForum.Api.Tests.Configuration;

public sealed class ServerErrorResponseTests
{
    private const string SecretMessage = "Cannot open server 'internal-db' with password 'secret'.";

    [Fact]
    public void Customize_ForServerError_UsesVietnameseTextAndTraceIdWithoutTheExceptionMessage()
    {
        var context = CreateContext(Environments.Production, StatusCodes.Status500InternalServerError);

        ServerErrorResponse.Customize(context);

        Assert.Equal(ServerErrorResponse.Title, context.ProblemDetails.Title);
        Assert.Equal(ServerErrorResponse.Detail, context.ProblemDetails.Detail);
        Assert.Equal("trace-123", context.ProblemDetails.Extensions["traceId"]);
        Assert.DoesNotContain("secret", context.ProblemDetails.Detail);
        Assert.DoesNotContain("internal-db", context.ProblemDetails.Title);
    }

    [Fact]
    public void Customize_InDevelopment_ShowsTheRealMessage()
    {
        var context = CreateContext(Environments.Development, StatusCodes.Status500InternalServerError);

        ServerErrorResponse.Customize(context);

        Assert.Equal(SecretMessage, context.ProblemDetails.Detail);
        Assert.Equal(ServerErrorResponse.Title, context.ProblemDetails.Title);
        Assert.Equal("trace-123", context.ProblemDetails.Extensions["traceId"]);
    }

    [Theory]
    [InlineData(StatusCodes.Status400BadRequest)]
    [InlineData(StatusCodes.Status401Unauthorized)]
    [InlineData(StatusCodes.Status404NotFound)]
    public void Customize_ForOtherStatusCodes_LeavesTheAnswerAlone(int statusCode)
    {
        var context = CreateContext(Environments.Production, statusCode);
        context.ProblemDetails.Title = "Tiêu đề riêng";
        context.ProblemDetails.Detail = "Chi tiết riêng";

        ServerErrorResponse.Customize(context);

        Assert.Equal("Tiêu đề riêng", context.ProblemDetails.Title);
        Assert.Equal("Chi tiết riêng", context.ProblemDetails.Detail);
        Assert.False(context.ProblemDetails.Extensions.ContainsKey("traceId"));
    }

    private static ProblemDetailsContext CreateContext(string environmentName, int statusCode)
    {
        var services = new ServiceCollection()
            .AddSingleton<IHostEnvironment>(new FakeEnvironment { EnvironmentName = environmentName })
            .BuildServiceProvider();
        var httpContext = new DefaultHttpContext
        {
            RequestServices = services,
            TraceIdentifier = "trace-123"
        };

        return new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = new ProblemDetails { Status = statusCode },
            Exception = new InvalidOperationException(SecretMessage)
        };
    }

    private sealed class FakeEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Production;
        public string ApplicationName { get; set; } = "Tests";
        public string ContentRootPath { get; set; } = string.Empty;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
