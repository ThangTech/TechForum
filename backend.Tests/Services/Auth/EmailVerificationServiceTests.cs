using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos.Auth;
using TechForum.Api.Filters;
using TechForum.Api.Middleware;
using TechForum.Api.Models;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class EmailVerificationServiceTests
{
    [Fact]
    public async Task SendAsync_SendsALinkThatKeepsTheTokenAfterTheHash()
    {
        var accounts = new FakeAccounts();
        var sender = new FakeSender();
        var user = Unverified();

        await Service(accounts, sender).SendAsync(user, default);

        Assert.Equal(user.Email, sender.To);
        var link = sender.Text!.Split('\n').Single(line => line.StartsWith("http", StringComparison.Ordinal));
        Assert.StartsWith("http://localhost:8088/verify-email#userId=member-1&token=", link);
        var token = link[(link.IndexOf("token=", StringComparison.Ordinal) + 6)..];
        Assert.Equal("confirm-token", Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(token)));
    }

    [Fact]
    public async Task SendAsync_ForAVerifiedAccount_SendsNothing()
    {
        var sender = new FakeSender();
        var user = Unverified();
        user.EmailConfirmed = true;

        await Service(new FakeAccounts(), sender).SendAsync(user, default);

        Assert.Null(sender.To);
    }

    [Fact]
    public async Task SendAsync_WhenTheMailServerFails_DoesNotStopTheRegistration()
    {
        await Service(new FakeAccounts(), new FakeSender { ShouldFail = true }).SendAsync(Unverified(), default);
    }

    [Fact]
    public async Task ResendAsync_ForAVerifiedAccount_IsAConflict()
    {
        var user = Unverified();
        user.EmailConfirmed = true;

        var result = await Service(new FakeAccounts { User = user }, new FakeSender()).ResendAsync(user.Id, default);

        Assert.Equal(ErrorType.Conflict, result.Error);
    }

    [Fact]
    public async Task ResendAsync_WithoutAMailServer_IsUnavailable()
    {
        var user = Unverified();

        var result = await Service(new FakeAccounts { User = user }, new FakeSender { Configured = false }).ResendAsync(user.Id, default);

        Assert.Equal(ErrorType.Unavailable, result.Error);
    }

    [Fact]
    public async Task ConfirmAsync_WithTheRightToken_VerifiesTheEmail()
    {
        var user = Unverified();
        var request = new ConfirmEmailRequest { UserId = user.Id, Token = Encode("confirm-token") };

        var result = await Service(new FakeAccounts { User = user }, new FakeSender()).ConfirmAsync(request, default);

        Assert.True(result.Succeeded);
        Assert.True(user.EmailConfirmed);
    }

    [Theory]
    [InlineData("wrong-token")]
    [InlineData(null)]
    public async Task ConfirmAsync_WithAWrongOrBrokenToken_IsRefused(string? token)
    {
        var user = Unverified();
        var request = new ConfirmEmailRequest { UserId = user.Id, Token = token is null ? "%%%" : Encode(token) };

        var result = await Service(new FakeAccounts { User = user }, new FakeSender()).ConfirmAsync(request, default);

        Assert.Equal(ErrorType.Validation, result.Error);
        Assert.False(user.EmailConfirmed);
    }

    [Fact]
    public void RequireVerifiedEmail_StopsAnUnverifiedAccountWith403()
    {
        var context = FilterContext(Unverified());

        new RequireVerifiedEmailAttribute().OnAuthorization(context);

        var result = Assert.IsType<ObjectResult>(context.Result);
        Assert.Equal(StatusCodes.Status403Forbidden, result.StatusCode);
        Assert.Equal("Bạn cần xác minh email", Assert.IsType<ProblemDetails>(result.Value).Title);
    }

    [Fact]
    public void RequireVerifiedEmail_LetsAVerifiedAccountThrough()
    {
        var user = Unverified();
        user.EmailConfirmed = true;
        var context = FilterContext(user);

        new RequireVerifiedEmailAttribute().OnAuthorization(context);

        Assert.Null(context.Result);
    }

    private static AuthorizationFilterContext FilterContext(ApplicationUser user)
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Items[ActiveAccountMiddleware.CurrentUserItemKey] = user;
        return new AuthorizationFilterContext(new ActionContext(httpContext, new RouteData(), new ActionDescriptor()), []);
    }

    private static string Encode(string token) => WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

    private static ApplicationUser Unverified() => new()
    {
        Id = "member-1", DisplayName = "Thành viên", Email = "member@example.test", EmailConfirmed = false
    };

    private static EmailVerificationService Service(FakeAccounts accounts, FakeSender sender) =>
        new(accounts, sender, Options.Create(new RecoveryEmailOptions { FrontendUrl = "http://localhost:8088" }),
            NullLogger<EmailVerificationService>.Instance);

    private sealed class FakeSender : IEmailSender
    {
        public bool Configured { get; init; } = true;
        public bool ShouldFail { get; init; }
        public string? To { get; private set; }
        public string? Text { get; private set; }
        public bool IsConfigured => Configured;

        public Task SendAsync(string to, string subject, string text, string? html, CancellationToken cancellationToken)
        {
            if (ShouldFail) throw new IOException("SMTP không phản hồi");
            To = to;
            Text = text;
            return Task.CompletedTask;
        }
    }

    // Chỉ những phần dịch vụ xác minh dùng tới.
    private sealed class FakeAccounts : IAccountRepository
    {
        public ApplicationUser? User { get; init; }

        public Task<ApplicationUser?> FindByIdAsync(string userId) =>
            Task.FromResult(User is not null && User.Id == userId ? User : null);

        public Task<string> GenerateEmailConfirmationTokenAsync(ApplicationUser user) => Task.FromResult("confirm-token");

        public Task<IdentityResult> ConfirmEmailAsync(ApplicationUser user, string token)
        {
            if (token != "confirm-token") return Task.FromResult(IdentityResult.Failed(new IdentityError { Code = "InvalidToken" }));
            user.EmailConfirmed = true;
            return Task.FromResult(IdentityResult.Success);
        }

        public Task<ApplicationUser?> FindByEmailAsync(string email) => throw new NotSupportedException();
        public Task<IdentityResult> CreateMemberAsync(ApplicationUser user, string password) => throw new NotSupportedException();
        public Task<IdentityResult> CreateExternalMemberAsync(ApplicationUser user, string provider, string providerKey) => throw new NotSupportedException();
        public Task<ApplicationUser?> FindByLoginAsync(string provider, string providerKey) => throw new NotSupportedException();
        public Task<IdentityResult> AddLoginAsync(ApplicationUser user, string provider, string providerKey) => throw new NotSupportedException();
        public Task<IdentityResult> ClaimByVerifiedEmailAsync(ApplicationUser user) => throw new NotSupportedException();
        public Task<bool> HasPasswordAsync(ApplicationUser user) => throw new NotSupportedException();
        public Task<IReadOnlyList<string>> GetLoginProvidersAsync(ApplicationUser user) => throw new NotSupportedException();
        public Task<IdentityResult> AddPasswordAsync(ApplicationUser user, string password) => throw new NotSupportedException();
        public Task<Microsoft.AspNetCore.Identity.SignInResult> CheckPasswordAsync(ApplicationUser user, string password) => throw new NotSupportedException();
        public Task<bool> IsLockedOutAsync(ApplicationUser user) => throw new NotSupportedException();
        public Task<IReadOnlyList<string>> GetRolesAsync(ApplicationUser user) => throw new NotSupportedException();
        public Task<IdentityResult> UpdateAsync(ApplicationUser user) => throw new NotSupportedException();
        public Task<IdentityResult> ChangePasswordAsync(ApplicationUser user, string currentPassword, string newPassword) => throw new NotSupportedException();
    }
}
