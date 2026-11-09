using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Services;
using TechForum.Api.Tests.Fakes;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class BannerImageStorageTests : IDisposable
{
    private const string Id = "0123456789abcdef0123456789abcdef";
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0];

    private readonly string testRoot = Path.Combine(Path.GetTempPath(), $"techforum-banner-tests-{Guid.NewGuid():N}");
    private readonly FakeCloudMediaClient cloud = new();

    [Fact]
    public async Task SaveAsync_SendsThePictureToTheBannersFolderAndGivesBackItsAddress()
    {
        var result = await CreateStorage().SaveAsync(CreateFile(Png, "image/png"), default);

        Assert.True(result.Succeeded);
        var upload = Assert.Single(cloud.Uploads);
        Assert.Matches("^techforum/banners/[a-f0-9]{32}$", upload.PublicId);
        Assert.Equal(CloudResourceType.Image, upload.Type);
        Assert.Matches("^https://res\\.cloudinary\\.com/demo-cloud/image/upload/v\\d+/techforum/banners/[a-f0-9]{32}\\.png$", result.ImageUrl);
        Assert.True(CreateStorage().IsStoredImageUrl(result.ImageUrl!));
    }

    [Fact]
    public async Task SaveAsync_RefusesAFileThatIsNotAPictureOrIsTooBig()
    {
        var storage = CreateStorage();

        var fake = await storage.SaveAsync(CreateFile("<script>x</script>"u8.ToArray(), "image/png"), default);
        var wrongType = await storage.SaveAsync(CreateFile(Png, "image/gif"), default);
        var tooBig = await storage.SaveAsync(CreateFile([.. Png, .. new byte[2000]], "image/png"), default);

        Assert.False(fake.Succeeded);
        Assert.False(wrongType.Succeeded);
        Assert.False(tooBig.Succeeded);
        Assert.Empty(cloud.Uploads);
    }

    [Fact]
    public async Task SaveAsync_WhenCloudinaryIsNotConfiguredOrFails_ExplainsItAndUploadsNothing()
    {
        cloud.IsConfigured = false;
        var notConfigured = await CreateStorage().SaveAsync(CreateFile(Png, "image/png"), default);

        cloud.IsConfigured = true;
        cloud.Fails = true;
        var failed = await CreateStorage().SaveAsync(CreateFile(Png, "image/png"), default);

        Assert.Contains("Cloudinary", notConfigured.Error);
        Assert.Contains("Cloudinary", failed.Error);
        Assert.Empty(cloud.Uploads);
    }

    [Fact]
    public async Task SaveAsync_WhenCloudinaryGivesAnUnknownAddress_DeletesTheFileAndRefuses()
    {
        cloud.AddressToReturn = "https://res.cloudinary.com/other-cloud/image/upload/v1/techforum/banners/x.png";

        var result = await CreateStorage().SaveAsync(CreateFile(Png, "image/png"), default);

        Assert.False(result.Succeeded);
        // The address is not one of this site, so it cannot be deleted by id either: nothing else is touched.
        Assert.Empty(cloud.Deleted);
    }

    [Theory]
    [InlineData("https://res.cloudinary.com/demo-cloud/image/upload/v5/techforum/banners/0123456789abcdef0123456789abcdef.png", true)]
    [InlineData("/media/banners/0123456789abcdef0123456789abcdef.png", true)]
    [InlineData("https://res.cloudinary.com/demo-cloud/image/upload/v5/techforum/avatars/0123456789abcdef0123456789abcdef.png", false)]
    [InlineData("https://res.cloudinary.com/other-cloud/image/upload/v5/techforum/banners/0123456789abcdef0123456789abcdef.png", false)]
    [InlineData("https://example.com/a.png", false)]
    [InlineData("/media/banners/../secret.png", false)]
    [InlineData("/media/banners/a/b.png", false)]
    [InlineData("", false)]
    public void IsStoredImageUrl_AcceptsOnlyBannerPicturesOfThisSite(string url, bool expected)
    {
        Assert.Equal(expected, CreateStorage().IsStoredImageUrl(url));
    }

    [Fact]
    public async Task DeleteAsync_RemovesACloudinaryPictureFromTheAccount()
    {
        var url = $"https://res.cloudinary.com/demo-cloud/image/upload/v5/techforum/banners/{Id}.png";

        await CreateStorage().DeleteAsync(url, default);

        Assert.Equal(new CloudAsset(CloudResourceType.Image, $"techforum/banners/{Id}"), Assert.Single(cloud.Deleted));
    }

    [Fact]
    public async Task DeleteAsync_RemovesAnOldPictureFromTheDisk()
    {
        var folder = Path.Combine(testRoot, "uploads", "banners");
        Directory.CreateDirectory(folder);
        var path = Path.Combine(folder, $"{Id}.png");
        await File.WriteAllBytesAsync(path, Png);

        await CreateStorage().DeleteAsync($"/media/banners/{Id}.png", default);

        Assert.False(File.Exists(path));
        Assert.Empty(cloud.Deleted);
    }

    [Fact]
    public async Task DeleteAsync_IgnoresAnAddressOfAnotherSiteAndAFailureOfCloudinary()
    {
        var storage = CreateStorage();
        await storage.DeleteAsync("https://example.com/a.png", default);
        await storage.DeleteAsync($"https://res.cloudinary.com/other-cloud/image/upload/v5/techforum/banners/{Id}.png", default);
        Assert.Empty(cloud.Deleted);

        // The banner is already changed; a file that cannot be deleted now is only logged.
        cloud.Fails = true;
        await storage.DeleteAsync($"https://res.cloudinary.com/demo-cloud/image/upload/v5/techforum/banners/{Id}.png", default);
    }

    public void Dispose()
    {
        if (!Directory.Exists(testRoot)) return;
        var resolved = Path.GetFullPath(testRoot);
        if (!Path.GetFileName(resolved).StartsWith("techforum-banner-tests-", StringComparison.Ordinal)) return;
        Directory.Delete(resolved, true);
    }

    private BannerImageStorage CreateStorage()
    {
        Directory.CreateDirectory(testRoot);
        var options = Options.Create(new MediaOptions { StoragePath = "uploads", RequestPath = "/media", MaxImageBytes = 1024 });
        return new BannerImageStorage(
            new FakeEnvironment { ContentRootPath = testRoot }, options, cloud, TestMediaRules.Create(),
            NullLogger<BannerImageStorage>.Instance);
    }

    private static FormFile CreateFile(byte[] bytes, string contentType) =>
        new(new MemoryStream(bytes), 0, bytes.Length, "file", "banner.png")
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };

    private sealed class FakeEnvironment : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "TechForum.Api.Tests";
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string WebRootPath { get; set; } = string.Empty;
        public string EnvironmentName { get; set; } = "Test";
        public string ContentRootPath { get; set; } = string.Empty;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
