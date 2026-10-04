using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using TechForum.Api.Middleware;
using Xunit;

namespace TechForum.Api.Tests.Middleware;

public sealed class RequestCancellationMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_WhenClientAborts_Returns499WithoutRethrowing()
    {
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();
        var context = new DefaultHttpContext { RequestAborted = cancellation.Token };
        var middleware = new RequestCancellationMiddleware(
            _ => throw new TaskCanceledException(),
            NullLogger<RequestCancellationMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        Assert.Equal(499, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_WhenServerTaskFailsWithoutClientAbort_Rethrows()
    {
        var context = new DefaultHttpContext();
        var middleware = new RequestCancellationMiddleware(
            _ => throw new TaskCanceledException(),
            NullLogger<RequestCancellationMiddleware>.Instance);

        await Assert.ThrowsAsync<TaskCanceledException>(() => middleware.InvokeAsync(context));
    }
}
