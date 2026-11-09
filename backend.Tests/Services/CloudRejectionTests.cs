using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class CloudRejectionTests
{
    [Theory]
    [InlineData("File size too large. Got 10847345. Maximum is 10485760.")]
    [InlineData("Video file size exceeds the maximum")]
    public void ToMessage_NamesAFileThatIsTooBig(string cloudinary)
    {
        Assert.Contains("vượt quá kích thước", CloudRejection.ToMessage(cloudinary));
    }

    [Theory]
    [InlineData("Image dimensions too many megapixels")]
    [InlineData("Maximum resolution exceeded")]
    public void ToMessage_NamesAPictureWithTooManyPixelsBeforeTheSizeRule(string cloudinary)
    {
        Assert.Contains("độ phân giải", CloudRejection.ToMessage(cloudinary));
    }

    [Theory]
    [InlineData("Failed to ping image")]
    [InlineData("Invalid image file")]
    [InlineData("Unsupported file format")]
    public void ToMessage_NamesAFileThatIsNotAReadablePicture(string cloudinary)
    {
        Assert.Contains("Không đọc được tệp", CloudRejection.ToMessage(cloudinary));
    }

    [Theory]
    [InlineData("File size too large. Got 10847345. Maximum is 10485760.")]
    [InlineData("Image dimensions too many megapixels")]
    [InlineData("Failed to ping image")]
    [InlineData("Something new happened at cloudinary")]
    public void ToMessage_NeverShowsTheNameOfTheStorageServiceOrItsOwnSentence(string cloudinary)
    {
        var message = CloudRejection.ToMessage(cloudinary);

        Assert.DoesNotContain("cloudinary", message, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("something new happened", message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ToMessage_GivesAGeneralSentenceWhenTheCauseIsNotKnown()
    {
        Assert.Contains("Không thể lưu tệp", CloudRejection.ToMessage("Something new happened"));
    }
}
