using System.Net;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class HostingRegistrationTests
{
    // Azure SQL bản miễn phí ngủ khi không ai dùng (40613); SQL Server trong Docker vừa bật (1801). API phải chờ, không dừng.
    [Theory]
    [InlineData(1801, true)]
    [InlineData(40613, true)]
    [InlineData(40501, true)]
    [InlineData(18456, false)]
    [InlineData(40615, false)]
    public void IsDatabaseStartingError_RetriesOnlyWhileTheDatabaseIsWakingUp(int errorNumber, bool expected)
    {
        Assert.Equal(expected, HostingRegistration.IsDatabaseStartingError(errorNumber));
    }

    // Render xóa ổ đĩa khi dịch vụ ngủ dậy: khóa ký link trong email phải nằm trong DB thì link mới còn dùng được.
    [Fact]
    public void AddHostingSettings_KeepsTheLinkKeysInTheDatabase()
    {
        var services = new ServiceCollection().AddLogging();
        services.AddHostingSettings(Configuration());

        using var provider = services.BuildServiceProvider();
        var options = provider.GetRequiredService<IOptions<KeyManagementOptions>>().Value;

        Assert.IsType<EntityFrameworkCoreXmlRepository<TechForumDbContext>>(options.XmlRepository);
    }

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

    // Sau nginx (Docker) chỉ có một proxy: header chỉ chứa IP của người dùng.
    [Fact]
    public async Task ForwardedHeaders_WithOneProxy_TakeTheAddressOfTheVisitor()
    {
        var context = await RunForwardedHeadersAsync(limit: 1, forwardedFor: "203.0.113.7");

        Assert.Equal(IPAddress.Parse("203.0.113.7"), context.Connection.RemoteIpAddress);
        Assert.True(context.Request.IsHttps);
    }

    // Render sau Vercel: Vercel ghi IP người dùng, rồi proxy của Render thêm IP của Vercel.
    [Fact]
    public async Task ForwardedHeaders_WithTwoProxies_SkipTheAddressOfVercel()
    {
        var context = await RunForwardedHeadersAsync(limit: 2, forwardedFor: "203.0.113.7, 76.76.21.21");

        Assert.Equal(IPAddress.Parse("203.0.113.7"), context.Connection.RemoteIpAddress);
        Assert.True(context.Request.IsHttps);
    }

    // Với giới hạn mặc định, chuỗi này cho ra IP của Vercel, dùng chung cho mọi người dùng.
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
