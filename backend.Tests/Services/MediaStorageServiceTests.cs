using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Models;
using TechForum.Api.Services;
using TechForum.Api.Tests.Fakes;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class MediaStorageServiceTests : IDisposable
{
    private const string UserId = "member-a";
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0];
    private static readonly byte[] Mp4 = [0, 0, 0, 0x18, (byte)'f', (byte)'t', (byte)'y', (byte)'p', (byte)'m', (byte)'p', (byte)'4', (byte)'2'];

    private readonly string testRoot = Path.Combine(
        Path.GetTempPath(),
        $"techforum-media-tests-{Guid.NewGuid():N}");
    private readonly FakeMediaAssetRepository repository = new();
    private readonly FakeCloudMediaClient cloud = new();

    // ---- uploading

    [Fact]
    public async Task StoreImageAsync_WithValidPng_SendsItToCloudinaryUnderAGeneratedId()
    {
        var result = await CreateService().StoreImageAsync(UserId, CreateFile(Png, "../../unsafe.exe", "image/png"), default);

        Assert.True(result.Succeeded);
        var upload = Assert.Single(cloud.Uploads);
        Assert.Matches("^techforum/images/[a-f0-9]{32}$", upload.PublicId);
        Assert.Equal(CloudResourceType.Image, upload.Type);
        // The name of the file that the member sent is not used anywhere.
        Assert.DoesNotContain("unsafe", upload.FileName);
        Assert.Matches("^https://res\\.cloudinary\\.com/demo-cloud/image/upload/v\\d+/techforum/images/[a-f0-9]{32}\\.png$", result.Media!.Link);
        Assert.Equal(result.Media.Link, result.Media.Path);
        Assert.False(Directory.Exists(testRoot), "nothing is written to the disk any more");
    }

    [Fact]
    public async Task StoreImageAsync_KeepsOnlyTheAddressAndTheIdInTheDatabase()
    {
        var result = await CreateService().StoreImageAsync(UserId, CreateFile(Png, "a.png", "image/png"), default);

        var asset = Assert.Single(repository.Items);
        Assert.Equal(result.Media!.Id, asset.Id);
        Assert.Equal(UserId, asset.UploaderId);
        Assert.Equal(result.Media.Link, asset.PublicUrl);
        Assert.Equal(cloud.Uploads[0].PublicId, asset.RelativePath);
        Assert.Equal("image/png", asset.ContentType);
        Assert.Equal(Png.Length, asset.Length);
    }

    [Fact]
    public async Task StoreVideoAsync_WithValidMp4_UsesTheVideoFolderAndKind()
    {
        var result = await CreateService().StoreVideoAsync(UserId, CreateFile(Mp4, "clip.mp4", "video/mp4"), default);

        Assert.True(result.Succeeded);
        var upload = Assert.Single(cloud.Uploads);
        Assert.Equal(CloudResourceType.Video, upload.Type);
        Assert.Matches("^techforum/videos/[a-f0-9]{32}$", upload.PublicId);
        Assert.Matches("/video/upload/v\\d+/techforum/videos/[a-f0-9]{32}\\.mp4$", result.Media!.Link);
    }

    [Theory]
    [InlineData("image/png")]
    [InlineData("text/plain")]
    public async Task StoreImageAsync_WithSpoofedOrMismatchedContent_RejectsFileBeforeUploading(string contentType)
    {
        var file = CreateFile("<script>alert(1)</script>"u8.ToArray(), "fake.png", contentType);

        var result = await CreateService().StoreImageAsync(UserId, file, default);

        Assert.False(result.Succeeded);
        Assert.False(result.IsUnavailable);
        Assert.Empty(cloud.Uploads);
        Assert.Empty(repository.Items);
    }

    [Fact]
    public async Task StoreImageAsync_WithAPictureThatIsTooBigOrEmpty_IsRejected()
    {
        var service = CreateService();

        var tooBig = await service.StoreImageAsync(UserId, CreateFile([.. Png, .. new byte[2000]], "a.png", "image/png"), default);
        var empty = await service.StoreImageAsync(UserId, CreateFile([], "a.png", "image/png"), default);

        Assert.False(tooBig.Succeeded);
        Assert.False(empty.Succeeded);
        Assert.Empty(cloud.Uploads);
    }

    [Fact]
    public async Task StoreImageAsync_WhenCloudinaryIsNotConfigured_IsUnavailableAndSavesNothing()
    {
        cloud.IsConfigured = false;

        var result = await CreateService().StoreImageAsync(UserId, CreateFile(Png, "a.png", "image/png"), default);

        Assert.True(result.IsUnavailable);
        Assert.Contains("Cloudinary", result.Error);
        Assert.Empty(repository.Items);
    }

    [Fact]
    public async Task StoreImageAsync_WhenCloudinaryFails_IsUnavailableAndSavesNothing()
    {
        cloud.Fails = true;

        var result = await CreateService().StoreImageAsync(UserId, CreateFile(Png, "a.png", "image/png"), default);

        Assert.True(result.IsUnavailable);
        Assert.Empty(repository.Items);
    }

    [Fact]
    public async Task StoreImageAsync_WhenCloudinaryGivesAnUnknownAddress_DeletesTheFileAndRefuses()
    {
        cloud.AddressToReturn = "https://res.cloudinary.com/other-cloud/image/upload/v1/x/y.png";

        var result = await CreateService().StoreImageAsync(UserId, CreateFile(Png, "a.png", "image/png"), default);

        Assert.True(result.IsUnavailable);
        Assert.Empty(repository.Items);
    }

    [Fact]
    public async Task StoreImageAsync_WhenTheRecordCannotBeSaved_DeletesTheUploadedFile()
    {
        repository.FailToAdd = true;

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            CreateService().StoreImageAsync(UserId, CreateFile(Png, "a.png", "image/png"), default));

        var deleted = Assert.Single(cloud.Deleted);
        Assert.Equal(cloud.Uploads[0].PublicId, deleted.PublicId);
    }

    // ---- deleting a file that is not used

    [Fact]
    public async Task DeleteUnusedAsync_WithOwnedOrphan_RemovesTheFileFromCloudinaryAndTheRecord()
    {
        var service = CreateService();
        var upload = await service.StoreImageAsync(UserId, CreateFile(Png, "a.png", "image/png"), default);

        var result = await service.DeleteUnusedAsync(UserId, upload.Media!.Id, default);

        Assert.Equal(MediaDeleteResult.Deleted, result);
        Assert.Empty(repository.Items);
        Assert.Equal(new CloudAsset(CloudResourceType.Image, cloud.Uploads[0].PublicId), Assert.Single(cloud.Deleted));
    }

    [Fact]
    public async Task DeleteUnusedAsync_WithADifferentOwner_DoesNotRevealOrDeleteMedia()
    {
        var service = CreateService();
        var upload = await service.StoreImageAsync(UserId, CreateFile(Png, "a.png", "image/png"), default);

        var result = await service.DeleteUnusedAsync("member-b", upload.Media!.Id, default);

        Assert.Equal(MediaDeleteResult.NotFound, result);
        Assert.Single(repository.Items);
        Assert.Empty(cloud.Deleted);
    }

    [Fact]
    public async Task DeleteUnusedAsync_WithAttachedMedia_RejectsDeletion()
    {
        var service = CreateService();
        var upload = await service.StoreImageAsync(UserId, CreateFile(Png, "a.png", "image/png"), default);
        repository.Items[0].TopicId = 10;

        var result = await service.DeleteUnusedAsync(UserId, upload.Media!.Id, default);

        Assert.Equal(MediaDeleteResult.Attached, result);
        Assert.Single(repository.Items);
        Assert.Empty(cloud.Deleted);
    }

    [Fact]
    public async Task DeleteUnusedAsync_WhenCloudinaryFails_KeepsTheRecordSoItCanBeTriedAgain()
    {
        var service = CreateService();
        var upload = await service.StoreImageAsync(UserId, CreateFile(Png, "a.png", "image/png"), default);
        cloud.Fails = true;

        var result = await service.DeleteUnusedAsync(UserId, upload.Media!.Id, default);

        Assert.Equal(MediaDeleteResult.Unavailable, result);
        Assert.Single(repository.Items);
    }

    [Fact]
    public async Task DeleteUnusedAsync_WithAFileOfTheTimeBeforeCloudinary_DeletesItFromTheDisk()
    {
        var folder = Path.Combine(testRoot, "uploads", "images");
        Directory.CreateDirectory(folder);
        var name = $"{Guid.NewGuid():N}.png";
        var path = Path.Combine(folder, name);
        await File.WriteAllBytesAsync(path, Png);
        var legacy = new MediaAsset
        {
            Id = Guid.NewGuid(), UploaderId = UserId, RelativePath = Path.Combine("images", name),
            PublicUrl = $"/media/images/{name}", ContentType = "image/png", Length = Png.Length, CreatedAtUtc = DateTimeOffset.UtcNow
        };
        repository.Items.Add(legacy);

        var result = await CreateService().DeleteUnusedAsync(UserId, legacy.Id, default);

        Assert.Equal(MediaDeleteResult.Deleted, result);
        Assert.False(File.Exists(path));
        Assert.Empty(cloud.Deleted);
    }

    // ---- the clean up of files that nobody uses

    [Fact]
    public async Task CleanupOrphansAsync_DeletesOldOrphansOfBothKindsAndKeepsTheRestOfTheBatchWhenOneFails()
    {
        var service = CreateService();
        var first = await service.StoreImageAsync(UserId, CreateFile(Png, "a.png", "image/png"), default);
        var second = await service.StoreVideoAsync(UserId, CreateFile(Mp4, "b.mp4", "video/mp4"), default);
        var third = await service.StoreImageAsync(UserId, CreateFile(Png, "c.png", "image/png"), default);
        foreach (var item in repository.Items)
        {
            item.CreatedAtUtc = DateTimeOffset.UtcNow.AddHours(-48);
        }

        // The second file cannot be deleted now.
        cloud.UndeletableIds.Add(cloud.Uploads[1].PublicId);

        var count = await service.CleanupOrphansAsync(default);

        Assert.Equal(2, count);
        Assert.Equal([second.Media!.Id], repository.Items.Select(item => item.Id));
        Assert.Contains(cloud.Deleted, item => item.PublicId == cloud.Uploads[0].PublicId);
        Assert.Contains(cloud.Deleted, item => item.PublicId == cloud.Uploads[2].PublicId);
        Assert.NotEqual(first.Media!.Id, third.Media!.Id);
    }

    [Fact]
    public async Task CleanupOrphansAsync_LeavesFilesThatAreNotOldEnough()
    {
        var service = CreateService();
        await service.StoreImageAsync(UserId, CreateFile(Png, "a.png", "image/png"), default);

        var count = await service.CleanupOrphansAsync(default);

        Assert.Equal(0, count);
        Assert.Single(repository.Items);
        Assert.Empty(cloud.Deleted);
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
        var environment = new FakeEnvironment { ContentRootPath = testRoot };
        var options = Options.Create(new MediaOptions
        {
            StoragePath = "uploads",
            RequestPath = "/media",
            MaxImageBytes = 1024,
            MaxVideoBytes = 2048
        });
        return new MediaStorageService(
            environment, options, repository, cloud, TestMediaRules.Create(), TimeProvider.System,
            NullLogger<MediaStorageService>.Instance);
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

    private sealed class FakeMediaAssetRepository : IMediaAssetRepository
    {
        public List<MediaAsset> Items { get; } = [];

        // Set to act like the database refusing the record.
        public bool FailToAdd { get; set; }

        public Task AddAsync(MediaAsset mediaAsset, CancellationToken cancellationToken)
        {
            if (FailToAdd)
            {
                throw new InvalidOperationException("Không lưu được vào cơ sở dữ liệu.");
            }

            Items.Add(mediaAsset);
            return Task.CompletedTask;
        }

        public Task<MediaAsset?> GetOwnedAsync(
            Guid id,
            string uploaderId,
            CancellationToken cancellationToken) =>
            Task.FromResult(Items.SingleOrDefault(item =>
                item.Id == id && item.UploaderId == uploaderId));

        public Task<IReadOnlyList<MediaAsset>> GetOwnedUnattachedByIdsAsync(
            IReadOnlyCollection<Guid> ids,
            string uploaderId,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<MediaAsset>>(Items.Where(item =>
                ids.Contains(item.Id) &&
                item.UploaderId == uploaderId &&
                item.TopicId == null).ToList());

        public Task<IReadOnlyList<MediaAsset>> GetOwnedAvailableForTopicByIdsAsync(
            IReadOnlyCollection<Guid> ids,
            string uploaderId,
            int topicId,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<MediaAsset>>(Items.Where(item =>
                ids.Contains(item.Id) &&
                item.UploaderId == uploaderId &&
                (item.TopicId == null || item.TopicId == topicId)).ToList());

        public Task<IReadOnlyList<MediaAsset>> GetOrphansOlderThanAsync(
            DateTimeOffset threshold,
            int take,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<MediaAsset>>(Items
                .Where(item => item.TopicId == null && item.CreatedAtUtc < threshold)
                .Take(take)
                .ToList());

        public Task DeleteAsync(MediaAsset mediaAsset, CancellationToken cancellationToken)
        {
            Items.Remove(mediaAsset);
            return Task.CompletedTask;
        }
    }
}
