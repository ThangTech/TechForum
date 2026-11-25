using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos.Auth;
using TechForum.Api.Models;
using TechForum.Api.Services;
using TechForum.Api.Tests.Fakes;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class PasswordRecoveryServiceTests
{
    [Fact]
    public async Task MissingMailConfiguration_DoesNotLookUpAccount()
    {
        var repository = new FakeRepository();
        var service = Create(repository, new FakeSender { IsConfigured = false });
        Assert.False(await service.RequestAsync("member@example.com", default));
        Assert.Equal(0, repository.LookupCount);
    }

    [Fact]
    public async Task UnknownAccount_ReturnsAcceptedWithoutSendingMail()
    {
        var sender = new FakeSender();
        Assert.True(await Create(new FakeRepository(), sender).RequestAsync("unknown@example.com", default));
        Assert.Null(sender.Url);
    }

    [Fact]
    public async Task ExistingAccount_UsesConfiguredOriginAndBase64UrlTokenInFragment()
    {
        var repository = new FakeRepository { User = User(), GeneratedToken = "token + / = tiếng Việt" };
        var sender = new FakeSender();
        Assert.True(await Create(repository, sender).RequestAsync(" member@example.com ", default));
        Assert.Equal("member@example.com", repository.LastEmail);
        Assert.Equal("member@example.com", sender.Email);
        var url = new Uri(Assert.IsType<string>(sender.Url));
        Assert.Equal("http://localhost:5173/reset-password", url.GetLeftPart(UriPartial.Path));
        Assert.Equal(string.Empty, url.Query);
        var fragment = QueryHelpers.ParseQuery(url.Fragment.TrimStart('#'));
        Assert.Equal(repository.GeneratedToken, Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(fragment["token"].ToString())));
    }

    [Theory]
    [InlineData("http://untrusted.example")]
    [InlineData("https://forum.example?redirect=elsewhere")]
    [InlineData("https://user:secret@forum.example")]
    [InlineData("https://forum.example/other")]
    public async Task InvalidFrontendConfiguration_IsRejectedBeforeAccountLookup(string url)
    {
        var repository = new FakeRepository { User = User() };
        Assert.False(await Create(repository, new FakeSender(), url: url).RequestAsync("member@example.com", default));
        Assert.Equal(0, repository.LookupCount);
    }

    [Fact]
    public async Task MailDeliveryFailure_DoesNotRevealExistingAccount()
    {
        var repository = new FakeRepository { User = User() };
        Assert.True(await Create(repository, new FakeSender { ShouldFail = true }).RequestAsync("member@example.com", default));
    }

    [Fact]
    public async Task MalformedToken_IsRejectedBeforeRepositoryReset()
    {
        var repository = new FakeRepository { User = User() };
        Assert.False(await Create(repository, new FakeSender()).ResetAsync(new ResetPasswordRequest
        {
            Email = "member@example.com", Token = "***invalid***", NewPassword = "Valid!2026"
        }, default));
        Assert.Null(repository.ResetToken);
    }

    [Fact]
    public async Task Reset_DelegatesDecodedTokenAndReturnsIdentityFailure()
    {
        var repository = new FakeRepository { User = User(), ResetResult = IdentityResult.Failed(new IdentityError { Code = "InvalidToken" }) };
        var refreshTokens = CreateRefreshTokens();
        Assert.False(await Create(repository, new FakeSender(), refreshTokens).ResetAsync(new ResetPasswordRequest
        {
            Email = "member@example.com", Token = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes("expired-token")), NewPassword = "Valid!2026"
        }, default));
        Assert.Equal("expired-token", repository.ResetToken);
        Assert.All(refreshTokens.Tokens, token => Assert.Null(token.RevokedAtUtc));
    }

    [Fact]
    public async Task Reset_WhenSuccessful_RevokesEveryRefreshTokenOfTheAccount()
    {
        var repository = new FakeRepository { User = User() };
        var refreshTokens = CreateRefreshTokens();
        Assert.True(await Create(repository, new FakeSender(), refreshTokens).ResetAsync(new ResetPasswordRequest
        {
            Email = "member@example.com", Token = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes("valid-token")), NewPassword = "Valid!2026"
        }, default));
        Assert.Equal("valid-token", repository.ResetToken);
        Assert.All(refreshTokens.Tokens.Where(token => token.UserId == "member-1"), token => Assert.NotNull(token.RevokedAtUtc));
        Assert.Null(refreshTokens.Tokens.Single(token => token.UserId == "other-member").RevokedAtUtc);
    }

    // Không mã hóa chỉ được phép với máy chủ mail trên chính máy hoặc Mailpit trong Docker.
    [Theory]
    [InlineData("smtp.example", false, false)]
    [InlineData("127.0.0.1", false, true)]
    [InlineData("mailpit", false, true)]
    [InlineData("smtp.example", true, true)]
    public void MailSender_RequiresTlsExceptForALocalMailServer(string host, bool tls, bool expected)
    {
        var sender = new EmailSender(Options.Create(new RecoveryEmailOptions
        {
            Host = host, UseTls = tls, FromAddress = "forum@example.com"
        }));
        Assert.Equal(expected, sender.IsConfigured);
    }

    // Người dùng bấm "Trả lời" thì thư về hộp thư liên hệ, không về địa chỉ no-reply.
    [Theory]
    [InlineData("contact@forum.example", "contact@forum.example")]
    [InlineData("", null)]
    public void MailSender_AddsReplyToOnlyWhenConfigured(string replyTo, string? expected)
    {
        var sender = new EmailSender(Options.Create(new RecoveryEmailOptions
        {
            FromAddress = "no-reply@forum.example", ReplyToAddress = replyTo
        }));

        var message = sender.CreateMessage("member@example.com", "Tiêu đề", "Nội dung");

        Assert.Equal("no-reply@forum.example", message.From.Mailboxes.Single().Address);
        Assert.Equal(expected, message.ReplyTo.Mailboxes.SingleOrDefault()?.Address);
    }

    [Theory]
    [InlineData("https://forum.example", true)]
    [InlineData("http://localhost:8088", true)]
    [InlineData("http://forum.example", false)]
    public void FrontendUrl_IsHttpsOrLocalhost(string url, bool expected)
    {
        Assert.Equal(expected, new RecoveryEmailOptions { FrontendUrl = url }.TryGetFrontendUrl(out _));
    }

    [Fact]
    public async Task ResetAsync_MarksTheEmailVerified()
    {
        var user = User();
        var repository = new FakeRepository { User = user };

        await Create(repository, new FakeSender()).ResetAsync(new ResetPasswordRequest
        {
            Email = "member@example.com", Token = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes("valid-token")), NewPassword = "Valid!2026"
        }, default);

        Assert.True(user.EmailConfirmed);
    }

    private static ApplicationUser User() => new() { Id = "member-1", DisplayName = "Member", Email = "member@example.com" };

    private static FakeRefreshTokenRepository CreateRefreshTokens()
    {
        var refreshTokens = new FakeRefreshTokenRepository();
        refreshTokens.Tokens.Add(new RefreshToken { UserId = "member-1", TokenHash = "hash-1" });
        refreshTokens.Tokens.Add(new RefreshToken { UserId = "member-1", TokenHash = "hash-2" });
        refreshTokens.Tokens.Add(new RefreshToken { UserId = "other-member", TokenHash = "hash-3" });
        return refreshTokens;
    }

    private static PasswordRecoveryService Create(
        FakeRepository repository,
        FakeSender sender,
        FakeRefreshTokenRepository? refreshTokens = null,
        string url = "http://localhost:5173") =>
        new(repository, refreshTokens ?? new FakeRefreshTokenRepository(), sender,
            Options.Create(new RecoveryEmailOptions { FrontendUrl = url }),
            TimeProvider.System, NullLogger<PasswordRecoveryService>.Instance);

    private sealed class FakeRepository : IPasswordRecoveryRepository
    {
        public ApplicationUser? User { get; init; }
        public int LookupCount { get; private set; }
        public string? LastEmail { get; private set; }
        public string GeneratedToken { get; init; } = "identity-token";
        public string? ResetToken { get; private set; }
        public IdentityResult ResetResult { get; init; } = IdentityResult.Success;
        public Task<ApplicationUser?> FindByEmailAsync(string email) { LookupCount++; LastEmail = email; return Task.FromResult(User); }
        public Task<string> GenerateTokenAsync(ApplicationUser user) => Task.FromResult(GeneratedToken);
        public Task<IdentityResult> ResetAsync(ApplicationUser user, string token, string password) { ResetToken = token; return Task.FromResult(ResetResult); }
        public Task<IdentityResult> MarkEmailConfirmedAsync(ApplicationUser user) { user.EmailConfirmed = true; return Task.FromResult(IdentityResult.Success); }
    }

    private sealed class FakeSender : IEmailSender
    {
        public bool IsConfigured { get; init; } = true;
        public bool ShouldFail { get; init; }
        public string? Url { get; private set; }
        public string? Email { get; private set; }
        public Task SendAsync(string to, string subject, string text, CancellationToken cancellationToken)
        {
            if (ShouldFail) throw new IOException("SMTP unavailable");
            Email = to;
            Url = text.Split('\n').Single(line => line.StartsWith("http", StringComparison.Ordinal));
            return Task.CompletedTask;
        }
    }
}
