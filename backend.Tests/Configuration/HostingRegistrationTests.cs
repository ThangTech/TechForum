using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class HostingRegistrationTests
{
    [Fact]
    public void GetForwardLimit_IsOneWhenItIsNotSet()
    {
        Assert.Equal(1, HostingRegistration.GetForwardLimit(Configuration()));
    }

    [Fact]
    public void GetForwardLimit_ReadsTheConfiguredValue()
    {
        Assert.Equal(2, HostingRegistration.GetForwardLimit(Configuration(("ReverseProxy:ForwardLimit", "2"))));
    }

    [Theory]
    [InlineData("0")]
    [InlineData("-1")]
    public void AddHostingSettings_StopsWhenTheForwardLimitIsBelowOne(string limit)
    {
        var configuration = Configuration(("ReverseProxy:Enabled", "true"), ("ReverseProxy:ForwardLimit", limit));

        Assert.Throws<InvalidOperationException>(() => new ServiceCollection().AddHostingSettings(configuration));
    }

    // Behind nginx (Docker) there is one proxy: the header holds only the address of the visitor.
    [Fact]
    public async Task ForwardedHeaders_WithOneProxy_TakeTheAddressOfTheVisitor()
    {
        var context = await RunForwardedHeadersAsync(limit: 1, forwardedFor: "203.0.113.7");

        Assert.Equal(IPAddress.Parse("203.0.113.7"), context.Connection.RemoteIpAddress);
        Assert.True(context.Request.IsHttps);
    }

    // On Render behind Vercel: Vercel writes the visitor, then the proxy of Render adds the address of Vercel.
    [Fact]
    public async Task ForwardedHeaders_WithTwoProxies_SkipTheAddressOfVercel()
    {
        var context = await RunForwardedHeadersAsync(limit: 2, forwardedFor: "203.0.113.7, 76.76.21.21");

        Assert.Equal(IPAddress.Parse("203.0.113.7"), context.Connection.RemoteIpAddress);
        Assert.True(context.Request.IsHttps);
    }

    // With the default limit the same chain gives the address of Vercel, shared by every visitor.
    [Fact]
    public async Task ForwardedHeaders_WithTwoProxiesAndLimitOne_GiveTheAddressOfVercel()
    {
        var context = await RunForwardedHeadersAsync(limit: 1, forwardedFor: "203.0.113.7, 76.76.21.21");

        Assert.Equal(IPAddress.Parse("76.76.21.21"), context.Connection.RemoteIpAddress);
    }

    private static async Task<HttpContext> RunForwardedHeadersAsync(int limit, string forwardedFor)
    {
        var configuration = Configuration(
            ("ReverseProxy:Enabled", "true"),
            ("ReverseProxy:ForwardLimit", limit.ToString()));
        var services = new ServiceCollection().AddHostingSettings(configuration).BuildServiceProvider();
        var options = services.GetRequiredService<IOptions<ForwardedHeadersOptions>>();
        var middleware = new ForwardedHeadersMiddleware(_ => Task.CompletedTask, NullLoggerFactory.Instance, options);

        var context = new DefaultHttpContext();
        context.Connection.RemoteIpAddress = IPAddress.Parse("10.0.0.5");
        context.Request.Scheme = "http";
        context.Request.Headers["X-Forwarded-For"] = forwardedFor;
        context.Request.Headers["X-Forwarded-Proto"] = "https";

        await middleware.Invoke(context);
        return context;
    }

    private static IConfiguration Configuration(params (string Key, string Value)[] values) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(values.Select(value => new KeyValuePair<string, string?>(value.Key, value.Value)))
            .Build();
}
