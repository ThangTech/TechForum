using System.Security.Claims;
using TechForum.Api.Extensions;
using Xunit;

namespace TechForum.Api.Tests.Extensions;

public sealed class ClaimsPrincipalExtensionsTests
{
    [Fact]
    public void GetUserIdOrNull_ReturnsTheIdOfTheSignedInAccount()
    {
        var user = CreateUser(new Claim(ClaimTypes.NameIdentifier, "member-1"));

        Assert.Equal("member-1", user.GetUserIdOrNull());
        Assert.Equal("member-1", user.GetRequiredUserId());
    }

    [Fact]
    public void GetUserIdOrNull_ForAGuest_ReturnsNull()
    {
        var guest = new ClaimsPrincipal(new ClaimsIdentity());

        Assert.Null(guest.GetUserIdOrNull());
    }

    [Fact]
    public void GetRequiredUserId_WhenTheTokenHasNoUserId_Throws()
    {
        var user = CreateUser(new Claim(ClaimTypes.Role, "Member"));

        Assert.Throws<InvalidOperationException>(() => user.GetRequiredUserId());
    }

    [Fact]
    public void GetUserIdOrNull_IgnoresOtherClaimsAndIdsSentByTheClient()
    {
        // A "sub" or custom claim must not be taken for the account id.
        var user = CreateUser(new Claim("userId", "attacker"), new Claim("sub", "someone-else"));

        Assert.Null(user.GetUserIdOrNull());
    }

    private static ClaimsPrincipal CreateUser(params Claim[] claims) =>
        new(new ClaimsIdentity(claims, authenticationType: "Test"));
}
