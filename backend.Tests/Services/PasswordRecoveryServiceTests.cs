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
        Assert.False(await Create(repository, new FakeSender(), url).RequestAsync("member@example.com", default));
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
        }));
        Assert.Null(repository.ResetToken);
    }

    [Fact]
    public async Task Reset_DelegatesDecodedTokenAndReturnsIdentityFailure()
    {
        var repository = new FakeRepository { User = User(), ResetResult = IdentityResult.Failed(new IdentityError { Code = "InvalidToken" }) };
        Assert.False(await Create(repository, new FakeSender()).ResetAsync(new ResetPasswordRequest
        {
            Email = "member@example.com", Token = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes("expired-token")), NewPassword = "Valid!2026"
        }));
        Assert.Equal("expired-token", repository.ResetToken);
    }

    [Theory]
    [InlineData("Production", "smtp.example", false, false)]
    [InlineData("Development", "smtp.example", false, false)]
    [InlineData("Development", "127.0.0.1", false, true)]
    [InlineData("Production", "smtp.example", true, true)]
    public void MailSender_RequiresTlsExceptForLocalDevelopment(string environment, string host, bool tls, bool expected)
    {
        var sender = new RecoveryEmailSender(Options.Create(new RecoveryEmailOptions
        {
            Host = host, UseTls = tls, FromAddress = "forum@example.com"
        }), new FakeEnvironment { EnvironmentName = environment });
        Assert.Equal(expected, sender.IsConfigured);
    }

    private static ApplicationUser User() => new() { DisplayName = "Member", Email = "member@example.com" };

    private static PasswordRecoveryService Create(FakeRepository repository, FakeSender sender, string url = "http://localhost:5173") =>
        new(repository, sender, Options.Create(new RecoveryEmailOptions { FrontendUrl = url }),
            new FakeEnvironment(), NullLogger<PasswordRecoveryService>.Instance);

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
    }

    private sealed class FakeSender : IRecoveryEmailSender
    {
        public bool IsConfigured { get; init; } = true;
        public bool ShouldFail { get; init; }
        public string? Url { get; private set; }
        public string? Email { get; private set; }
        public Task SendAsync(string email, string resetUrl, CancellationToken cancellationToken)
        {
            if (ShouldFail) throw new IOException("SMTP unavailable");
            Email = email; Url = resetUrl; return Task.CompletedTask;
        }
    }

    private sealed class FakeEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Development";
        public string ApplicationName { get; set; } = "Tests";
        public string ContentRootPath { get; set; } = string.Empty;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
