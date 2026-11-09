using Microsoft.AspNetCore.Http;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Models;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class BannerServiceTests
{
    private const string ImageUrl = "/media/banners/abc.png";
    private static readonly DateTimeOffset Now = new(2026, 11, 9, 8, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task Create_SavesTheBannerAndWritesTheAuditLog()
    {
        var context = new Context();

        var result = await context.Service.CreateAsync("admin", Request(), default);

        Assert.Equal(BannerWriteFailure.None, result.Failure);
        var banner = Assert.Single(context.Banners.Items);
        Assert.Equal("Khuyến mãi mùa thu", banner.Title);
        Assert.True(banner.IsActive);
        Assert.Equal(Now, banner.CreatedAtUtc);
        Assert.Equal("banner-created", Assert.Single(context.Audit.Actions));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Create_RejectsAnEmptyTitle(string title)
    {
        var context = new Context();

        var result = await context.Service.CreateAsync("admin", Request(title: title), default);

        Assert.Equal(BannerWriteFailure.Validation, result.Failure);
        Assert.Equal("title", result.Field);
        Assert.Empty(context.Banners.Items);
    }

    [Theory]
    [InlineData("/media/avatars/abc.png")]
    [InlineData("https://example.com/a.png")]
    [InlineData("")]
    public async Task Create_RejectsAnImageThatWasNotUploadedAsABannerPicture(string imageUrl)
    {
        var result = await new Context().Service.CreateAsync("admin", Request(imageUrl: imageUrl), default);

        Assert.Equal(BannerWriteFailure.Validation, result.Failure);
        Assert.Equal("imageUrl", result.Field);
    }

    [Theory]
    [InlineData("javascript:alert(1)")]
    [InlineData("//evil.example.com")]
    [InlineData("ftp://example.com/file")]
    [InlineData("topics/5")]
    public async Task Create_RejectsUnsafeLinks(string link)
    {
        var result = await new Context().Service.CreateAsync("admin", Request(link: link), default);

        Assert.Equal(BannerWriteFailure.Validation, result.Failure);
        Assert.Equal("linkUrl", result.Field);
    }

    [Theory]
    [InlineData("/topics/5")]
    [InlineData("https://example.com/event")]
    [InlineData(null)]
    [InlineData("")]
    public async Task Create_AcceptsSiteLinksWebLinksAndNoLink(string? link)
    {
        var result = await new Context().Service.CreateAsync("admin", Request(link: link), default);

        Assert.Equal(BannerWriteFailure.None, result.Failure);
    }

    [Fact]
    public async Task Create_RejectsAnEndBeforeTheStart()
    {
        var request = Request(starts: Now.AddDays(2), ends: Now.AddDays(1));

        var result = await new Context().Service.CreateAsync("admin", request, default);

        Assert.Equal(BannerWriteFailure.Validation, result.Failure);
        Assert.Equal("endsAtUtc", result.Field);
    }

    [Fact]
    public async Task Update_ChangesTheFieldsAndRemovesTheOldPictureFile()
    {
        var context = new Context();
        context.Banners.Items.Add(NewBanner(1));

        var result = await context.Service.UpdateAsync(
            "admin", 1, Request(title: "Tiêu đề mới", imageUrl: "/media/banners/new.png"), default);

        Assert.Equal(BannerWriteFailure.None, result.Failure);
        Assert.Equal("Tiêu đề mới", context.Banners.Items[0].Title);
        Assert.Equal(ImageUrl, Assert.Single(context.Images.Deleted));
        Assert.Equal("banner-updated", Assert.Single(context.Audit.Actions));
    }

    [Fact]
    public async Task Update_KeepsThePictureFileWhenThePictureIsTheSame()
    {
        var context = new Context();
        context.Banners.Items.Add(NewBanner(1));

        await context.Service.UpdateAsync("admin", 1, Request(title: "Chỉ đổi tiêu đề"), default);

        Assert.Empty(context.Images.Deleted);
    }

    [Fact]
    public async Task Update_KeepsThePictureFileWhenAnotherBannerUsesIt()
    {
        var context = new Context();
        context.Banners.Items.Add(NewBanner(1));
        context.Banners.Items.Add(NewBanner(2));

        await context.Service.UpdateAsync("admin", 1, Request(imageUrl: "/media/banners/new.png"), default);

        Assert.Empty(context.Images.Deleted);
    }

    [Fact]
    public async Task Delete_KeepsThePictureFileWhenAnotherBannerUsesIt()
    {
        var context = new Context();
        context.Banners.Items.Add(NewBanner(1));
        context.Banners.Items.Add(NewBanner(2));

        await context.Service.DeleteAsync("admin", 1, default);

        Assert.Empty(context.Images.Deleted);
    }

    [Fact]
    public async Task Update_ReturnsNotFoundForAnUnknownBanner()
    {
        var result = await new Context().Service.UpdateAsync("admin", 99, Request(), default);

        Assert.Equal(BannerWriteFailure.NotFound, result.Failure);
    }

    [Fact]
    public async Task SetActive_TurnsTheBannerOffAndOn()
    {
        var context = new Context();
        context.Banners.Items.Add(NewBanner(1));

        await context.Service.SetActiveAsync("admin", 1, false, default);
        Assert.False(context.Banners.Items[0].IsActive);
        await context.Service.SetActiveAsync("admin", 1, true, default);

        Assert.True(context.Banners.Items[0].IsActive);
        Assert.Equal(["banner-deactivated", "banner-activated"], context.Audit.Actions);
    }

    [Fact]
    public async Task Delete_RemovesTheBannerAndItsPictureFile()
    {
        var context = new Context();
        context.Banners.Items.Add(NewBanner(1));

        var result = await context.Service.DeleteAsync("admin", 1, default);

        Assert.Equal(BannerWriteFailure.None, result.Failure);
        Assert.Empty(context.Banners.Items);
        Assert.Equal(ImageUrl, Assert.Single(context.Images.Deleted));
        Assert.Equal("banner-deleted", Assert.Single(context.Audit.Actions));
    }

    [Fact]
    public async Task Delete_ReturnsNotFoundForAnUnknownBanner()
    {
        var result = await new Context().Service.DeleteAsync("admin", 99, default);

        Assert.Equal(BannerWriteFailure.NotFound, result.Failure);
    }

    [Fact]
    public async Task GetShown_AsksTheRepositoryWithTheCurrentTime()
    {
        var context = new Context();
        context.Banners.Items.Add(NewBanner(1));

        var shown = await context.Service.GetShownAsync(default);

        Assert.Equal(Now, context.Banners.LastShownTime);
        var dto = Assert.Single(shown);
        Assert.Equal(new BannerDto(1, "Banner 1", ImageUrl, "/topics/1"), dto);
    }

    private static SaveBannerRequest Request(
        string? title = "Khuyến mãi mùa thu",
        string? imageUrl = ImageUrl,
        string? link = "/topics/1",
        DateTimeOffset? starts = null,
        DateTimeOffset? ends = null) =>
        new(title, imageUrl, link, 1, starts, ends);

    private static Banner NewBanner(int id) => new()
    {
        Id = id,
        Title = "Banner " + id,
        ImageUrl = ImageUrl,
        LinkUrl = "/topics/" + id,
        DisplayOrder = id,
        CreatedAtUtc = Now
    };

    private sealed class Context
    {
        public FakeBanners Banners { get; } = new();
        public FakeImages Images { get; } = new();
        public FakeAudit Audit { get; } = new();
        public BannerService Service => new(Banners, Images, Audit, new FixedTimeProvider());
    }

    private sealed class FixedTimeProvider : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => Now;
    }

    private sealed class FakeBanners : IBannerRepository
    {
        public List<Banner> Items { get; } = [];
        public DateTimeOffset? LastShownTime { get; private set; }

        public Task<IReadOnlyList<Banner>> GetShownAsync(DateTimeOffset now, CancellationToken cancellationToken)
        {
            LastShownTime = now;
            return Task.FromResult<IReadOnlyList<Banner>>(Items.ToList());
        }

        public Task<IReadOnlyList<Banner>> GetAllAsync(CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<Banner>>(Items.ToList());

        public Task<Banner?> GetTrackedByIdAsync(int id, CancellationToken cancellationToken) =>
            Task.FromResult(Items.SingleOrDefault(banner => banner.Id == id));

        public Task<bool> ImageUrlInUseAsync(string imageUrl, int exceptId, CancellationToken cancellationToken) =>
            Task.FromResult(Items.Any(banner => banner.ImageUrl == imageUrl && banner.Id != exceptId));

        public Task AddAsync(Banner banner, CancellationToken cancellationToken)
        {
            banner.Id = Items.Count + 1;
            Items.Add(banner);
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;

        public Task RemoveAsync(Banner banner, CancellationToken cancellationToken)
        {
            Items.Remove(banner);
            return Task.CompletedTask;
        }
    }

    private sealed class FakeImages : IBannerImageStorage
    {
        public List<string> Deleted { get; } = [];

        public Task<BannerImageResult> SaveAsync(IFormFile file, CancellationToken cancellationToken) =>
            Task.FromResult(BannerImageResult.Success(ImageUrl));

        public bool IsStoredImageUrl(string imageUrl) => imageUrl.StartsWith("/media/banners/", StringComparison.Ordinal);

        public Task DeleteAsync(string imageUrl, CancellationToken cancellationToken)
        {
            Deleted.Add(imageUrl);
            return Task.CompletedTask;
        }
    }

    private sealed class FakeAudit : IAdminAuditService
    {
        public List<string> Actions { get; } = [];

        public Task RecordAsync(
            string administratorId,
            string action,
            string targetType,
            string targetId,
            string? previousValue,
            string? newValue,
            string reason,
            CancellationToken cancellationToken)
        {
            Actions.Add(action);
            return Task.CompletedTask;
        }
    }
}
