using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class TopicCoverImageTests
{
    private const string First = "/media/images/0123456789abcdef0123456789abcdef.png";
    private const string Second = "/media/images/fedcba9876543210fedcba9876543210.webp";

    [Fact]
    public void Extract_ReturnsTheFirstPicture()
    {
        var html = $"<p>Chữ</p><img src=\"{First}\" alt=\"a\"><img src=\"{Second}\">";

        Assert.Equal(First, TopicCoverImage.Extract(html));
    }

    [Fact]
    public void Extract_FindsAPictureWhenOtherAttributesComeBeforeSrc()
    {
        var html = $"<img class=\"fr-dib\" alt=\"b\" src=\"{Second}\">";

        Assert.Equal(Second, TopicCoverImage.Extract(html));
    }

    [Theory]
    [InlineData("")]
    [InlineData("<p>Không có ảnh</p>")]
    [InlineData("<video controls><source src=\"/media/videos/0123456789abcdef0123456789abcdef.mp4\"></video>")]
    [InlineData("<img src=\"https://other.example.com/a.png\">")]
    [InlineData("<a href=\"/media/images/0123456789abcdef0123456789abcdef.png\">liên kết</a>")]
    public void Extract_ReturnsNullWhenThereIsNoSitePicture(string html)
    {
        Assert.Null(TopicCoverImage.Extract(html));
    }

    [Fact]
    public void Extract_IgnoresAVideoAndTakesThePictureAfterIt()
    {
        var html = $"<video controls><source src=\"/media/videos/0123456789abcdef0123456789abcdef.mp4\"></video><img src=\"{Second}\">";

        Assert.Equal(Second, TopicCoverImage.Extract(html));
    }

    [Fact]
    public void Extract_ReturnsNullForAnAddressThatIsTooLongToStore()
    {
        var html = $"<img src=\"/media/images/{new string('a', TopicCoverImage.MaxLength)}.png\">";

        Assert.Null(TopicCoverImage.Extract(html));
    }
}
