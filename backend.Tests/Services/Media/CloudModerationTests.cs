using CloudinaryDotNet.Actions;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class CloudModerationTests
{
    [Fact]
    public void IsRejected_WhenTheCheckRefusedThePicture()
    {
        Assert.True(CloudModeration.IsRejected([new Moderation { Kind = "aws_rek", Status = ModerationStatus.Rejected }]));
    }

    [Theory]
    [InlineData(ModerationStatus.Approved)]
    [InlineData(ModerationStatus.Pending)]
    [InlineData(ModerationStatus.Aborted)]
    public void IsRejected_IsFalseForAnyOtherAnswer(ModerationStatus status)
    {
        Assert.False(CloudModeration.IsRejected([new Moderation { Kind = "aws_rek", Status = status }]));
    }

    [Fact]
    public void IsRejected_IsFalseWhenThePictureWasNotChecked()
    {
        Assert.False(CloudModeration.IsRejected(null));
        Assert.False(CloudModeration.IsRejected([]));
    }

    [Theory]
    [InlineData("You don't have an active subscription to the AWS Rekognition add-on")]
    [InlineData("Moderation quota exceeded for aws_rek")]
    public void IsUnavailable_WhenTheAddOnCannotCheck(string error)
    {
        Assert.True(CloudModeration.IsUnavailable(error));
    }

    [Theory]
    [InlineData("Invalid image file")]
    [InlineData(null)]
    public void IsUnavailable_IsFalseForAProblemOfTheFile(string? error)
    {
        Assert.False(CloudModeration.IsUnavailable(error));
    }

    [Fact]
    public void ToMessage_TellsTheMemberThatThePictureIsNotAllowed()
    {
        Assert.Contains("không phù hợp", CloudRejection.ToMessage(CloudModeration.RejectedMessage));
    }
}
