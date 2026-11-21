using TechForum.Api.Dtos;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class ContentCheckServiceTests
{
    private static ContentCheckService CreateService(params string[] words) => new(new SetFilter(new ProfanityFilterSet(words)));

    [Fact]
    public async Task CheckAsync_GivesTheCleanedTextsThatChange()
    {
        var result = await CreateService("foobar", "bazqux").CheckAsync(new CheckContentRequest
        {
            Title = "A foobar title",
            Summary = "A b4zqux summary",
            BodyHtml = "<p>Body with <strong>foobar</strong> and <a href=\"/foobar\">a link</a></p>",
        }, default);

        Assert.True(result.HasProfanity);
        Assert.Equal("A *** title", result.Title);
        Assert.Equal("A *** summary", result.Summary);
        Assert.Equal("<p>Body with <strong>***</strong> and <a href=\"/foobar\">a link</a></p>", result.BodyHtml);
    }

    [Fact]
    public async Task CheckAsync_GivesNullForATextThatDoesNotChange()
    {
        var result = await CreateService("foobar").CheckAsync(new CheckContentRequest
        {
            Title = "A clean title",
            Summary = "foobar here",
            BodyHtml = "<p>Clean body</p>",
        }, default);

        Assert.True(result.HasProfanity);
        Assert.Null(result.Title);
        Assert.Equal("*** here", result.Summary);
        Assert.Null(result.BodyHtml);
    }

    [Fact]
    public async Task CheckAsync_WhenNothingChanges_SaysThereIsNoProfanity()
    {
        var result = await CreateService("foobar").CheckAsync(new CheckContentRequest
        {
            Title = "Title",
            Summary = "Summary",
            BodyHtml = "<p>Body</p>",
        }, default);

        Assert.False(result.HasProfanity);
        Assert.Null(result.Title);
        Assert.Null(result.Summary);
        Assert.Null(result.BodyHtml);
    }

    [Fact]
    public async Task CheckAsync_WithMissingOrEmptyTexts_SaysThereIsNoProfanity()
    {
        var result = await CreateService("foobar").CheckAsync(new CheckContentRequest { Summary = "" }, default);

        Assert.False(result.HasProfanity);
    }

    [Fact]
    public async Task CheckAsync_UsesTheSameRulesAsTheFilterThatCleansASavedPost()
    {
        var set = new ProfanityFilterSet(["cặp"]);
        var service = new ContentCheckService(new SetFilter(set));
        const string text = "các bạn cặp cap c.ặ.p";

        var result = await service.CheckAsync(new CheckContentRequest { Title = text }, default);

        Assert.Equal(set.Apply(text, false), result.Title);
    }

    private sealed class SetFilter(ProfanityFilterSet set) : IProfanityFilter
    {
        public Task<string> FilterAsync(string text, bool isHtml, CancellationToken cancellationToken) =>
            Task.FromResult(set.Apply(text, isHtml));

        public Task WarmUpAsync(CancellationToken cancellationToken) => Task.CompletedTask;

        public void Invalidate()
        {
        }
    }
}
