using TechForum.Api.Models;
using TechForum.Api.Services;
using TechForum.Api.Tests.Fakes;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class RefreshTokenCleanupServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 8, 3, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task DeleteExpiredAsync_RemovesTokensExpiredLongAgo()
    {
        var repository = new FakeRefreshTokenRepository();
        repository.Tokens.Add(CreateToken("old", Now - RefreshTokenCleanupService.KeepAfterExpiry - TimeSpan.FromDays(1)));
        var service = CreateService(repository);

        var deleted = await service.DeleteExpiredAsync(CancellationToken.None);

        Assert.Equal(1, deleted);
        Assert.Empty(repository.Tokens);
    }

    [Fact]
    public async Task DeleteExpiredAsync_KeepsTokensThatExpiredRecently()
    {
        var repository = new FakeRefreshTokenRepository();
        repository.Tokens.Add(CreateToken("recent", Now - TimeSpan.FromDays(1)));
        var service = CreateService(repository);

        var deleted = await service.DeleteExpiredAsync(CancellationToken.None);

        Assert.Equal(0, deleted);
        Assert.Single(repository.Tokens);
    }

    [Fact]
    public async Task DeleteExpiredAsync_KeepsTokensThatAreStillValid()
    {
        var repository = new FakeRefreshTokenRepository();
        repository.Tokens.Add(CreateToken("valid", Now + TimeSpan.FromDays(5)));
        var service = CreateService(repository);

        await service.DeleteExpiredAsync(CancellationToken.None);

        Assert.Single(repository.Tokens);
    }

    [Fact]
    public async Task DeleteExpiredAsync_KeepsRevokedTokensThatHaveNotExpired()
    {
        // A revoked token must stay until it expires, so reusing it is still noticed as theft.
        var repository = new FakeRefreshTokenRepository();
        var revoked = CreateToken("revoked", Now + TimeSpan.FromDays(2));
        revoked.RevokedAtUtc = Now - TimeSpan.FromDays(40);
        repository.Tokens.Add(revoked);
        var service = CreateService(repository);

        await service.DeleteExpiredAsync(CancellationToken.None);

        Assert.Single(repository.Tokens);
    }

    private static RefreshTokenCleanupService CreateService(FakeRefreshTokenRepository repository) =>
        new(repository, new FixedTimeProvider());

    private static RefreshToken CreateToken(string hash, DateTimeOffset expiresAtUtc) => new()
    {
        UserId = "member-a",
        TokenHash = hash,
        CreatedAtUtc = expiresAtUtc - TimeSpan.FromDays(7),
        ExpiresAtUtc = expiresAtUtc
    };

    private sealed class FixedTimeProvider : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => Now;
    }
}
