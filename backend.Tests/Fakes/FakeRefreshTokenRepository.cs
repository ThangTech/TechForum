using TechForum.Api.Data.Repositories;
using TechForum.Api.Models;

namespace TechForum.Api.Tests.Fakes;

// In-memory stand-in for the refresh token table, shared by the auth tests.
public sealed class FakeRefreshTokenRepository : IRefreshTokenRepository
{
    public List<RefreshToken> Tokens { get; } = [];

    // Set to false to act like another request that rotated the same token first.
    public bool RotateResult { get; set; } = true;

    public Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken)
    {
        refreshToken.Id = Tokens.Count + 1;
        Tokens.Add(refreshToken);
        return Task.CompletedTask;
    }

    public Task<RefreshToken?> FindByHashAsync(string tokenHash, CancellationToken cancellationToken) =>
        Task.FromResult(Tokens.SingleOrDefault(token => token.TokenHash == tokenHash));

    public Task<bool> RotateAsync(
        long currentTokenId,
        RefreshToken replacement,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        if (!RotateResult)
        {
            return Task.FromResult(false);
        }

        var current = Tokens.Single(token => token.Id == currentTokenId);
        current.RevokedAtUtc = now;
        current.ReplacedByTokenHash = replacement.TokenHash;
        replacement.Id = Tokens.Count + 1;
        Tokens.Add(replacement);
        return Task.FromResult(true);
    }

    public Task RevokeByHashAsync(string tokenHash, DateTimeOffset now, CancellationToken cancellationToken)
    {
        foreach (var token in Tokens.Where(item => item.TokenHash == tokenHash && item.RevokedAtUtc is null))
        {
            token.RevokedAtUtc = now;
        }

        return Task.CompletedTask;
    }

    public Task RevokeAllForUserAsync(string userId, DateTimeOffset now, CancellationToken cancellationToken)
    {
        foreach (var token in Tokens.Where(item => item.UserId == userId && item.RevokedAtUtc is null))
        {
            token.RevokedAtUtc = now;
        }

        return Task.CompletedTask;
    }
}
