using Microsoft.IdentityModel.JsonWebTokens;
using TechForum.Api.Configuration;
using TechForum.Api.Constants;
using TechForum.Api.Models;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class TokenServiceTests
{
    private static readonly JwtOptions Options = new()
    {
        SigningKey = "unit-test-signing-key-with-at-least-32-chars",
        AccessTokenMinutes = 15
    };

    [Fact]
    public async Task CreateAccessToken_ContainsUserRolesAndSecurityStamp()
    {
        var service = CreateService(DateTimeOffset.UtcNow);
        var user = CreateUser();

        var result = service.CreateAccessToken(user, [RoleNames.Member, RoleNames.Administrator]);

        var validation = await new JsonWebTokenHandler().ValidateTokenAsync(
            result.Token,
            Options.CreateValidationParameters());
        Assert.True(validation.IsValid);
        Assert.Equal("user-1", validation.Claims["sub"]);
        Assert.Equal("stamp-1", validation.Claims[AuthClaimTypes.SecurityStamp]);
        var roles = Assert.IsAssignableFrom<IEnumerable<object>>(validation.Claims["role"]);
        Assert.Equal([RoleNames.Member, RoleNames.Administrator], roles.Select(role => role.ToString()));
    }

    [Fact]
    public void CreateAccessToken_ExpiresAfterConfiguredMinutes()
    {
        var now = new DateTimeOffset(2026, 11, 7, 8, 0, 0, TimeSpan.Zero);
        var service = CreateService(now);

        var result = service.CreateAccessToken(CreateUser(), [RoleNames.Member]);

        Assert.Equal(now.AddMinutes(15), result.ExpiresAtUtc);
    }

    [Fact]
    public async Task CreateAccessToken_WhenTokenIsOld_FailsValidation()
    {
        var service = CreateService(DateTimeOffset.UtcNow.AddHours(-1));

        var result = service.CreateAccessToken(CreateUser(), [RoleNames.Member]);

        var validation = await new JsonWebTokenHandler().ValidateTokenAsync(
            result.Token,
            Options.CreateValidationParameters());
        Assert.False(validation.IsValid);
    }

    [Fact]
    public async Task CreateAccessToken_WhenSignedWithAnotherKey_FailsValidation()
    {
        var otherOptions = new JwtOptions { SigningKey = "another-signing-key-with-at-least-32-chars!" };
        var service = new TokenService(Microsoft.Extensions.Options.Options.Create(otherOptions), TimeProvider.System);

        var result = service.CreateAccessToken(CreateUser(), [RoleNames.Member]);

        var validation = await new JsonWebTokenHandler().ValidateTokenAsync(
            result.Token,
            Options.CreateValidationParameters());
        Assert.False(validation.IsValid);
    }

    [Fact]
    public void GenerateRefreshToken_ReturnsDifferentValueEachTime()
    {
        var service = CreateService(DateTimeOffset.UtcNow);

        var first = service.GenerateRefreshToken();
        var second = service.GenerateRefreshToken();

        Assert.NotEqual(first, second);
        Assert.True(first.Length >= 43);
    }

    [Fact]
    public void HashRefreshToken_IsStableAndDoesNotContainTheToken()
    {
        var service = CreateService(DateTimeOffset.UtcNow);
        var token = service.GenerateRefreshToken();

        var firstHash = service.HashRefreshToken(token);
        var secondHash = service.HashRefreshToken(token);

        Assert.Equal(firstHash, secondHash);
        Assert.Equal(64, firstHash.Length);
        Assert.DoesNotContain(token, firstHash);
        Assert.NotEqual(firstHash, service.HashRefreshToken(service.GenerateRefreshToken()));
    }

    [Theory]
    [InlineData("")]
    [InlineData("too-short")]
    public void GetConfigurationError_WhenSigningKeyIsMissingOrShort_ReturnsMessage(string signingKey)
    {
        var options = new JwtOptions { SigningKey = signingKey };

        Assert.NotNull(options.GetConfigurationError());
    }

    [Fact]
    public void GetConfigurationError_WhenSettingsAreValid_ReturnsNull()
    {
        Assert.Null(Options.GetConfigurationError());
    }

    private static TokenService CreateService(DateTimeOffset now) =>
        new(Microsoft.Extensions.Options.Options.Create(Options), new FixedTimeProvider(now));

    private static ApplicationUser CreateUser() => new()
    {
        Id = "user-1",
        DisplayName = "Member A",
        UserName = "member.a@techforum.local",
        SecurityStamp = "stamp-1"
    };

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
