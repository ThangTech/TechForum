using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using TechForum.Api.Dtos;
using TechForum.Api.Filters;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class ProfanityFilterAttributeTests
{
    private static async Task<ActionExecutingContext> RunAsync(params object?[] arguments)
    {
        var services = new ServiceCollection()
            .AddSingleton<IProfanityFilter>(new ProfanityFilter(
                new MemoryCache(new MemoryCacheOptions()), new FixedLoader(["bazqux", "foobar"]), NullLogger<ProfanityFilter>.Instance))
            .BuildServiceProvider();
        var httpContext = new DefaultHttpContext { RequestServices = services };
        var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());
        var context = new ActionExecutingContext(
            actionContext, new List<IFilterMetadata>(), new Dictionary<string, object?>(), controller: new object());
        for (var index = 0; index < arguments.Length; index++) context.ActionArguments[$"argument{index}"] = arguments[index];

        await new ProfanityFilterAttribute().OnActionExecutionAsync(
            context,
            () => Task.FromResult(new ActionExecutedContext(actionContext, new List<IFilterMetadata>(), new object())));
        return context;
    }

    [Fact]
    public async Task OnActionExecution_CleansTheMarkedTextsOfATopicRequest()
    {
        var request = new CreateTopicRequest(
            "What the foobar is DI", "A bazqux summary that is long enough", "<p>Body with <b>bazqux</b> and <a href=\"/foobar\">a link</a></p>",
            "article", TestIds.Id(1), [TestIds.Id(1)], [], true);

        await RunAsync(request);

        Assert.Equal("What the *** is DI", request.Title);
        Assert.Equal("A *** summary that is long enough", request.Summary);
        Assert.Equal("<p>Body with <b>***</b> and <a href=\"/foobar\">a link</a></p>", request.BodyHtml);
    }

    [Fact]
    public async Task OnActionExecution_LeavesTheUnmarkedValuesAlone()
    {
        var request = new CreateTopicRequest("Title", "Summary long enough", "<p>ok</p>", "article", TestIds.Id(7), [TestIds.Id(1), TestIds.Id(2)], [], true);

        await RunAsync(request);

        Assert.Equal("article", request.Type);
        Assert.Equal(TestIds.Id(7), request.CategoryId);
        Assert.Equal([TestIds.Id(1), TestIds.Id(2)], request.TagIds);
        Assert.True(request.Publish);
    }

    [Fact]
    public async Task OnActionExecution_CleansAnAnswerAndAnUpdate()
    {
        var answer = new CreateAnswerRequest("<p>you are bazqux</p>", TestIds.Id(5));
        var update = new UpdateTopicRequest("foobar", "summary", "<p>bazqux</p>", "question", TestIds.Id(1), [], [], false);

        await RunAsync(answer, update);

        Assert.Equal("<p>you are ***</p>", answer.BodyHtml);
        Assert.Equal(TestIds.Id(5), answer.ParentAnswerId);
        Assert.Equal("***", update.Title);
        Assert.Equal("<p>***</p>", update.BodyHtml);
    }

    [Fact]
    public async Task OnActionExecution_IgnoresRouteValuesNullsAndRequestsWithoutMarks()
    {
        var other = new SaveBannedWordRequest("bazqux");

        var context = await RunAsync(5, "bazqux", null, other);

        Assert.Equal("bazqux", context.ActionArguments["argument1"]);
        Assert.Equal("bazqux", other.Word);
    }

    [Fact]
    public async Task OnActionExecution_WithATextThatIsNull_DoesNotFail()
    {
        var request = new CreateAnswerRequest(null);

        await RunAsync(request);

        Assert.Null(request.BodyHtml);
    }

    [Fact]
    public async Task OnActionExecution_CallsTheNextStepOfThePipeline()
    {
        var services = new ServiceCollection()
            .AddSingleton<IProfanityFilter>(new ProfanityFilter(
                new MemoryCache(new MemoryCacheOptions()), new FixedLoader([]), NullLogger<ProfanityFilter>.Instance))
            .BuildServiceProvider();
        var actionContext = new ActionContext(new DefaultHttpContext { RequestServices = services }, new RouteData(), new ActionDescriptor());
        var context = new ActionExecutingContext(actionContext, new List<IFilterMetadata>(), new Dictionary<string, object?>(), new object());
        var called = false;

        await new ProfanityFilterAttribute().OnActionExecutionAsync(context, () =>
        {
            called = true;
            return Task.FromResult(new ActionExecutedContext(actionContext, new List<IFilterMetadata>(), new object()));
        });

        Assert.True(called);
    }

    private sealed class FixedLoader(IReadOnlyList<string> words) : IBannedWordLoader
    {
        public Task<IReadOnlyList<string>> LoadAsync(CancellationToken cancellationToken) => Task.FromResult(words);
    }
}
