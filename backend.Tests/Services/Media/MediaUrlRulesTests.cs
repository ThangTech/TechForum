using TechForum.Api.Services;
using TechForum.Api.Tests.Fakes;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class MediaUrlRulesTests
{
    private const string Id1 = "0123456789abcdef0123456789abcdef";
    private const string Id2 = "fedcba9876543210fedcba9876543210";
    private static readonly string CloudImage = $"https://res.cloudinary.com/demo-cloud/image/upload/v1699999999/techforum/images/{Id1}.png";
    private static readonly string CloudImageNoVersion = $"https://res.cloudinary.com/demo-cloud/image/upload/techforum/images/{Id2}.webp";
    private static readonly string CloudVideo = $"https://res.cloudinary.com/demo-cloud/video/upload/v1699999999/techforum/videos/{Id1}.mp4";
    private static readonly string LocalImage = $"/media/images/{Id1}.png";
    private static readonly string LocalVideo = $"/media/videos/{Id2}.mp4";

    private readonly MediaUrlRules rules = TestMediaRules.Create();

    // ---- which addresses may be used in a topic

    [Fact]
    public void IsTopicMediaUrl_AcceptsTheFilesOfThisSite()
    {
        Assert.True(rules.IsTopicMediaUrl(CloudImage));
        Assert.True(rules.IsTopicMediaUrl(CloudImageNoVersion));
        Assert.True(rules.IsTopicMediaUrl(CloudVideo));
        // The files that were stored on the disk before the move keep working.
        Assert.True(rules.IsTopicMediaUrl(LocalImage));
        Assert.True(rules.IsTopicMediaUrl(LocalVideo));
    }

    [Theory]
    [InlineData("https://res.cloudinary.com/other-cloud/image/upload/v1/techforum/images/0123456789abcdef0123456789abcdef.png")]
    [InlineData("https://res.cloudinary.com/demo-cloud/image/upload/v1/other-folder/images/0123456789abcdef0123456789abcdef.png")]
    [InlineData("http://res.cloudinary.com/demo-cloud/image/upload/v1/techforum/images/0123456789abcdef0123456789abcdef.png")]
    [InlineData("https://res.cloudinary.com.evil.example/demo-cloud/image/upload/v1/techforum/images/0123456789abcdef0123456789abcdef.png")]
    [InlineData("https://res.cloudinary.com/demo-cloud/image/upload/v1/techforum/images/0123456789abcdef0123456789abcdef.png?x=1")]
    [InlineData("https://res.cloudinary.com/demo-cloud/image/upload/c_scale,w_5/techforum/images/0123456789abcdef0123456789abcdef.png")]
    [InlineData("https://res.cloudinary.com/demo-cloud/image/upload/v1/techforum/avatars/0123456789abcdef0123456789abcdef.png")]
    [InlineData("https://res.cloudinary.com/demo-cloud/image/upload/v1/techforum/images/not-a-site-name.png")]
    [InlineData("https://res.cloudinary.com/demo-cloud/video/upload/v1/techforum/images/0123456789abcdef0123456789abcdef.png")]
    [InlineData("https://example.com/a.png")]
    [InlineData("/media/avatars/0123456789abcdef0123456789abcdef.png")]
    [InlineData("")]
    public void IsTopicMediaUrl_RefusesEverythingElse(string url)
    {
        Assert.False(rules.IsTopicMediaUrl(url));
    }

    [Fact]
    public void IsTopicMediaUrl_WithoutACloudinaryAccount_AcceptsOnlyTheLocalFiles()
    {
        var withoutCloud = TestMediaRules.Create(cloudName: "");

        Assert.True(withoutCloud.IsTopicMediaUrl(LocalImage));
        Assert.False(withoutCloud.IsTopicMediaUrl(CloudImage));
    }

    [Fact]
    public void FindTopicMediaUrls_FindsEveryPictureAndVideoOfBothKinds()
    {
        var html = $"<p>x</p><img src=\"{CloudImage}\"><video src=\"{CloudVideo}\"></video><img src=\"{LocalImage}\"><img src=\"https://other.example.com/a.png\">";

        Assert.Equal([CloudImage, CloudVideo, LocalImage], rules.FindTopicMediaUrls(html));
    }

    // ---- the cover picture of a topic

    [Fact]
    public void FindFirstImageUrl_ReturnsTheFirstPicture()
    {
        var html = $"<p>Chữ</p><img src=\"{CloudImage}\" alt=\"a\"><img src=\"{CloudImageNoVersion}\">";

        Assert.Equal(CloudImage, rules.FindFirstImageUrl(html));
    }

    [Fact]
    public void FindFirstImageUrl_FindsAnOldLocalPictureAndOtherAttributesBeforeSrc()
    {
        Assert.Equal(LocalImage, rules.FindFirstImageUrl($"<img class=\"fr-dib\" alt=\"b\" src=\"{LocalImage}\">"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("<p>Không có ảnh</p>")]
    [InlineData("<img src=\"https://other.example.com/a.png\">")]
    [InlineData("<img src=\"https://res.cloudinary.com/other-cloud/image/upload/v1/techforum/images/0123456789abcdef0123456789abcdef.png\">")]
    [InlineData("<video controls><source src=\"/media/videos/0123456789abcdef0123456789abcdef.mp4\"></video>")]
    [InlineData("<a href=\"/media/images/0123456789abcdef0123456789abcdef.png\">liên kết</a>")]
    public void FindFirstImageUrl_ReturnsNullWhenThereIsNoSitePicture(string html)
    {
        Assert.Null(rules.FindFirstImageUrl(html));
    }

    [Fact]
    public void FindFirstImageUrl_IgnoresAVideoAndTakesThePictureAfterIt()
    {
        var html = $"<video controls><source src=\"{CloudVideo}\"></video><img src=\"{CloudImage}\">";

        Assert.Equal(CloudImage, rules.FindFirstImageUrl(html));
    }

    [Fact]
    public void FindFirstImageUrl_ReturnsNullForAnAddressThatIsTooLongToStore()
    {
        // A long folder name makes an address that matches the rules but does not fit in the cover column.
        var longRules = TestMediaRules.Create(folder: new string('f', MediaUrlRules.MaxCoverLength));
        var url = $"https://res.cloudinary.com/demo-cloud/image/upload/v1/{new string('f', MediaUrlRules.MaxCoverLength)}/images/{Id1}.png";

        Assert.True(longRules.IsTopicMediaUrl(url));
        Assert.Null(longRules.FindFirstImageUrl($"<img src=\"{url}\">"));
    }

    // ---- avatars and banners

    [Fact]
    public void IsCloudAvatarUrl_AndIsCloudBannerUrl_AcceptOnlyTheirOwnFolder()
    {
        var avatar = $"https://res.cloudinary.com/demo-cloud/image/upload/v5/techforum/avatars/{Id1}.jpg";
        var banner = $"https://res.cloudinary.com/demo-cloud/image/upload/v5/techforum/banners/{Id1}.png";

        Assert.True(rules.IsCloudAvatarUrl(avatar));
        Assert.False(rules.IsCloudAvatarUrl(banner));
        Assert.True(rules.IsCloudBannerUrl(banner));
        Assert.False(rules.IsCloudBannerUrl(avatar));
        Assert.False(rules.IsCloudBannerUrl(CloudImage));
    }

    // ---- finding the file to delete

    [Fact]
    public void TryGetCloudAsset_GivesTheIdAndKindThatCloudinaryNeedsToDelete()
    {
        var image = rules.TryGetCloudAsset(CloudImage);
        var video = rules.TryGetCloudAsset(CloudVideo);

        Assert.Equal(new CloudAsset(CloudResourceType.Image, $"techforum/images/{Id1}"), image);
        Assert.Equal(new CloudAsset(CloudResourceType.Video, $"techforum/videos/{Id1}"), video);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("/media/images/0123456789abcdef0123456789abcdef.png")]
    [InlineData("https://res.cloudinary.com/other-cloud/image/upload/v1/techforum/images/0123456789abcdef0123456789abcdef.png")]
    [InlineData("https://res.cloudinary.com/demo-cloud/image/upload/v1/other-folder/images/0123456789abcdef0123456789abcdef.png")]
    [InlineData("https://res.cloudinary.com/demo-cloud/image/upload/v1/techforum/images/../../x.png")]
    public void TryGetCloudAsset_GivesNothingForAFileThatIsNotInTheFolderOfThisSite(string? url)
    {
        Assert.Null(rules.TryGetCloudAsset(url));
    }
}
