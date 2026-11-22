using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Filters;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class VideoUploadSizeLimitAttributeTests
{
    [Fact]
    public void RaisesTheLimitToTheSizeOfAVideoPlusTheForm()
    {
        var feature = new MaxBodySizeFeature { MaxRequestBodySize = 30_000_000 };

        new VideoUploadSizeLimitAttribute().OnResourceExecuting(Context(feature, maxVideoBytes: 50 * 1024 * 1024));

        Assert.Equal(50 * 1024 * 1024 + VideoUploadSizeLimitAttribute.FormMargin, feature.MaxRequestBodySize);
    }

    [Fact]
    public void LeavesTheLimitWhenTheBodyHasAlreadyBeenRead()
    {
        var feature = new MaxBodySizeFeature { MaxRequestBodySize = 30_000_000, IsReadOnly = true };

        new VideoUploadSizeLimitAttribute().OnResourceExecuting(Context(feature, maxVideoBytes: 50 * 1024 * 1024));

        Assert.Equal(30_000_000, feature.MaxRequestBodySize);
    }

    private static ResourceExecutingContext Context(IHttpMaxRequestBodySizeFeature feature, long maxVideoBytes)
    {
        var services = new ServiceCollection();
        services.AddSingleton(Options.Create(new MediaOptions { MaxVideoBytes = maxVideoBytes }));
        var httpContext = new DefaultHttpContext { RequestServices = services.BuildServiceProvider() };
        httpContext.Features.Set(feature);
        var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());
        return new ResourceExecutingContext(actionContext, [], []);
    }

    private sealed class MaxBodySizeFeature : IHttpMaxRequestBodySizeFeature
    {
        public bool IsReadOnly { get; init; }
        public long? MaxRequestBodySize { get; set; }
    }
}
