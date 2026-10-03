using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class MediaStorageServiceTests : IDisposable
{
    private readonly string testRoot = Path.Combine(
        Path.GetTempPath(),
        $"techforum-media-tests-{Guid.NewGuid():N}");

    [Fact]
    public async Task StoreImageAsync_WithValidPng_UsesGeneratedSafeName()
    {
        var service = CreateService();
        var bytes = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0 };
        var file = CreateFile(bytes, "../../unsafe.exe", "image/png");

        var result = await service.StoreImageAsync(file, CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.NotNull(result.Media);
        Assert.Matches("^/media/images/[a-f0-9]{32}\\.png$", result.Media.Link);
        var storedName = Path.GetFileName(result.Media.Link);
        Assert.True(File.Exists(Path.Combine(testRoot, "uploads", "images", storedName)));
    }

    [Theory]
    [InlineData("image/png")]
    [InlineData("text/plain")]
    public async Task StoreImageAsync_WithSpoofedOrMismatchedContent_RejectsFile(string contentType)
    {
        var service = CreateService();
        var file = CreateFile("<script>alert(1)</script>"u8.ToArray(), "fake.png", contentType);

        var result = await service.StoreImageAsync(file, CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.False(Directory.Exists(Path.Combine(testRoot, "uploads", "images")));
    }

    public void Dispose()
    {
        if (!Directory.Exists(testRoot)) return;
        var resolved = Path.GetFullPath(testRoot);
        var tempRoot = Path.GetFullPath(Path.GetTempPath());
        if (!resolved.StartsWith(tempRoot, StringComparison.OrdinalIgnoreCase) ||
            !Path.GetFileName(resolved).StartsWith("techforum-media-tests-", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Test media path không an toàn để dọn.");
        }

        Directory.Delete(resolved, true);
    }

    private MediaStorageService CreateService()
    {
        Directory.CreateDirectory(testRoot);
        var environment = new FakeEnvironment { ContentRootPath = testRoot };
        var options = Options.Create(new MediaOptions
        {
            StoragePath = "uploads",
            RequestPath = "/media",
            MaxImageBytes = 1024,
            MaxVideoBytes = 2048
        });
        return new MediaStorageService(environment, options);
    }

    private static FormFile CreateFile(byte[] bytes, string name, string contentType)
    {
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "file", name)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
    }

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
