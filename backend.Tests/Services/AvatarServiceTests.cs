using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
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

public sealed class AvatarServiceTests : IDisposable
{
    private const string UserId = "member-a";
    private const string Id = "0123456789abcdef0123456789abcdef";
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0];
    private static readonly string OldCloudAvatar = $"https://res.cloudinary.com/demo-cloud/image/upload/v1/techforum/avatars/{Id}.jpg";

    private readonly string testRoot = Path.Combine(Path.GetTempPath(), $"techforum-avatar-tests-{Guid.NewGuid():N}");
    private readonly FakeCloudMediaClient cloud = new();
    private readonly FakeAccounts accounts = new();

    [Fact]
    public async Task UpdateAsync_SendsTheAvatarToCloudinaryAndSavesItsAddress()
    {
        var result = await CreateService().UpdateAsync(UserId, CreateFile(Png, "image/png"), default);

        Assert.True(result.Succeeded);
        var upload = Assert.Single(cloud.Uploads);
        Assert.Matches("^techforum/avatars/[a-f0-9]{32}$", upload.PublicId);
        Assert.Matches("^https://res\\.cloudinary\\.com/demo-cloud/image/upload/v\\d+/techforum/avatars/[a-f0-9]{32}\\.png$", accounts.User.AvatarUrl);
        Assert.Equal(accounts.User.AvatarUrl, result.User!.AvatarUrl);
    }

    [Fact]
    public async Task UpdateAsync_DeletesTheOldAvatarOfCloudinary()
    {
        accounts.User.AvatarUrl = OldCloudAvatar;

        await CreateService().UpdateAsync(UserId, CreateFile(Png, "image/png"), default);

        Assert.Equal(new CloudAsset(CloudResourceType.Image, $"techforum/avatars/{Id}"), Assert.Single(cloud.Deleted));
    }

    [Fact]
    public async Task UpdateAsync_DeletesTheOldAvatarOfTheDisk()
    {
        var folder = Path.Combine(testRoot, "uploads", "avatars");
        Directory.CreateDirectory(folder);
        var path = Path.Combine(folder, $"{Id}.jpg");
        await File.WriteAllBytesAsync(path, Png);
        accounts.User.AvatarUrl = $"/media/avatars/{Id}.jpg";

        await CreateService().UpdateAsync(UserId, CreateFile(Png, "image/png"), default);

        Assert.False(File.Exists(path));
        Assert.Empty(cloud.Deleted);
    }

    [Fact]
    public async Task UpdateAsync_StillSucceedsWhenTheOldAvatarCannotBeDeleted()
    {
        accounts.User.AvatarUrl = OldCloudAvatar;
        cloud.UndeletableIds.Add($"techforum/avatars/{Id}");

        var result = await CreateService().UpdateAsync(UserId, CreateFile(Png, "image/png"), default);

        Assert.True(result.Succeeded);
    }

    [Fact]
    public async Task UpdateAsync_RefusesAFileThatIsNotAPictureOrIsTooBigAndKeepsTheOldAvatar()
    {
        accounts.User.AvatarUrl = OldCloudAvatar;
        var service = CreateService();

        var fake = await service.UpdateAsync(UserId, CreateFile("<script>x</script>"u8.ToArray(), "image/png"), default);
        var gif = await service.UpdateAsync(UserId, CreateFile("GIF89a......"u8.ToArray(), "image/gif"), default);
        var tooBig = await service.UpdateAsync(UserId, CreateFile([.. Png, .. new byte[3000]], "image/png"), default);

        Assert.False(fake.Succeeded);
        Assert.False(gif.Succeeded);
        Assert.False(tooBig.Succeeded);
        Assert.Equal(OldCloudAvatar, accounts.User.AvatarUrl);
        Assert.Empty(cloud.Uploads);
    }

    [Fact]
    public async Task UpdateAsync_WhenCloudinaryIsNotConfiguredOrFails_KeepsTheOldAvatarAndExplains()
    {
        accounts.User.AvatarUrl = OldCloudAvatar;
        cloud.IsConfigured = false;
        var notConfigured = await CreateService().UpdateAsync(UserId, CreateFile(Png, "image/png"), default);

        cloud.IsConfigured = true;
        cloud.Fails = true;
        var failed = await CreateService().UpdateAsync(UserId, CreateFile(Png, "image/png"), default);

        Assert.False(notConfigured.Succeeded);
        Assert.False(failed.Succeeded);
        Assert.DoesNotContain("cloudinary", notConfigured.Error, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("cloudinary", failed.Error, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(OldCloudAvatar, accounts.User.AvatarUrl);
    }

    [Fact]
    public async Task UpdateAsync_WhenCloudinaryRefusesTheFile_TellsTheMemberWhyAndKeepsTheOldAvatar()
    {
        accounts.User.AvatarUrl = OldCloudAvatar;
        cloud.RejectWith = "Failed to ping image";

        var result = await CreateService().UpdateAsync(UserId, CreateFile(Png, "image/png"), default);

        Assert.False(result.Succeeded);
        Assert.Contains("Không đọc được tệp", result.Error);
        Assert.Equal(OldCloudAvatar, accounts.User.AvatarUrl);
        Assert.Empty(cloud.Deleted);
    }

    [Fact]
    public async Task UpdateAsync_WhenTheUserCannotBeSaved_DeletesTheNewFile()
    {
        accounts.FailToUpdate = true;

        var result = await CreateService().UpdateAsync(UserId, CreateFile(Png, "image/png"), default);

        Assert.False(result.Succeeded);
        Assert.Equal(cloud.Uploads[0].PublicId, Assert.Single(cloud.Deleted).PublicId);
    }

    [Fact]
    public async Task UpdateAsync_WhenCloudinaryGivesAnUnknownAddress_RefusesAndDoesNotSaveIt()
    {
        cloud.AddressToReturn = "https://res.cloudinary.com/other-cloud/image/upload/v1/techforum/avatars/x.png";

        var result = await CreateService().UpdateAsync(UserId, CreateFile(Png, "image/png"), default);

        Assert.False(result.Succeeded);
        Assert.Null(accounts.User.AvatarUrl);
    }

    [Fact]
    public async Task DeleteAsync_RemovesTheAvatarFromTheUserAndFromCloudinary()
    {
        accounts.User.AvatarUrl = OldCloudAvatar;

        var result = await CreateService().DeleteAsync(UserId, default);

        Assert.True(result.Succeeded);
        Assert.Null(accounts.User.AvatarUrl);
        Assert.Equal($"techforum/avatars/{Id}", Assert.Single(cloud.Deleted).PublicId);
    }

    [Fact]
    public async Task UpdateAsync_ForAnUnknownUser_IsRefused()
    {
        var result = await CreateService().UpdateAsync("nobody", CreateFile(Png, "image/png"), default);

        Assert.False(result.Succeeded);
        Assert.Empty(cloud.Uploads);
    }

    public void Dispose()
    {
        if (!Directory.Exists(testRoot)) return;
        var resolved = Path.GetFullPath(testRoot);
        if (!Path.GetFileName(resolved).StartsWith("techforum-avatar-tests-", StringComparison.Ordinal)) return;
        Directory.Delete(resolved, true);
    }

    private AvatarService CreateService()
    {
        Directory.CreateDirectory(testRoot);
        var options = Options.Create(new MediaOptions { StoragePath = "uploads", RequestPath = "/media", MaxAvatarBytes = 1024 });
        return new AvatarService(
            accounts, new FakeEnvironment { ContentRootPath = testRoot }, options, cloud, TestMediaRules.Create(),
            NullLogger<AvatarService>.Instance);
    }

    private static FormFile CreateFile(byte[] bytes, string contentType) =>
        new(new MemoryStream(bytes), 0, bytes.Length, "file", "avatar.png")
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

    // Only the members that the avatar service uses.
    private sealed class FakeAccounts : IAccountRepository
    {
        public ApplicationUser User { get; } = new() { Id = UserId, DisplayName = "Thành viên A", Email = "a@example.test" };

        public bool FailToUpdate { get; set; }

        public Task<ApplicationUser?> FindByIdAsync(string userId) =>
            Task.FromResult<ApplicationUser?>(userId == UserId ? User : null);

        public Task<IdentityResult> UpdateAsync(ApplicationUser user) =>
            Task.FromResult(FailToUpdate ? IdentityResult.Failed(new IdentityError { Description = "lỗi" }) : IdentityResult.Success);

        public Task<IReadOnlyList<string>> GetRolesAsync(ApplicationUser user) =>
            Task.FromResult<IReadOnlyList<string>>(["Member"]);

        public Task<ApplicationUser?> FindByEmailAsync(string email) => throw new NotSupportedException();

        public Task<IdentityResult> CreateMemberAsync(ApplicationUser user, string password) => throw new NotSupportedException();

        public Task<Microsoft.AspNetCore.Identity.SignInResult> CheckPasswordAsync(ApplicationUser user, string password) =>
            throw new NotSupportedException();

        public Task<bool> IsLockedOutAsync(ApplicationUser user) => throw new NotSupportedException();

        public Task<IdentityResult> ChangePasswordAsync(ApplicationUser user, string currentPassword, string newPassword) =>
            throw new NotSupportedException();
    }
}
