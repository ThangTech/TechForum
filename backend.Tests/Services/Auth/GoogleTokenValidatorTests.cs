using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class GoogleTokenValidatorTests
{
    // Token sai định dạng bị loại khi đọc, trước khi cần mạng, nên trả null (401) chứ không ném lỗi (500).
    [Theory]
    [InlineData("x.y.z")]
    [InlineData("not-a-token")]
    [InlineData("")]
    public async Task ValidateAsync_WithAMalformedToken_ReturnsNull(string credential)
    {
        var validator = new GoogleTokenValidator(
            Options.Create(new GoogleAuthOptions { ClientId = "123-test.apps.googleusercontent.com" }),
            NullLogger<GoogleTokenValidator>.Instance);

        Assert.Null(await validator.ValidateAsync(credential));
    }

    [Fact]
    public void IsConfigured_OnlyWithAClientId()
    {
        Assert.False(new GoogleTokenValidator(Options.Create(new GoogleAuthOptions()), NullLogger<GoogleTokenValidator>.Instance).IsConfigured);
    }
}
