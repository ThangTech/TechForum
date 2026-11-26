using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using TechForum.Api.Constants;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos;
using TechForum.Api.Dtos.Auth;
using TechForum.Api.Models;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class AccountClosureServiceTests
{
    [Fact]
    public async Task CloseAsync_NeedsTheConfirmationWordAndTheRightPassword()
    {
        var accounts = new Accounts { PasswordIsRight = false };
        var closure = new Closure();
        var service = Service(accounts, closure);

        var noWord = await service.CloseAsync("member", new CloseAccountRequest("pw", "xoa"), default);
        var wrongPassword = await service.CloseAsync("member", new CloseAccountRequest("pw", "XÓA"), default);

        Assert.Equal("confirmation", noWord.Field);
        Assert.Equal("password", wrongPassword.Field);
        Assert.Null(closure.Closed);
    }

    [Fact]
    public async Task CloseAsync_RefusesAnAdministrator()
    {
        var closure = new Closure();
        var result = await Service(new Accounts { Roles = [RoleNames.Administrator] }, closure)
            .CloseAsync("member", new CloseAccountRequest("pw", "XÓA"), default);

        Assert.Equal(ErrorType.Conflict, result.Error);
        Assert.Null(closure.Closed);
    }

    [Fact]
    public async Task CloseAsync_WithoutPassword_ClosesAfterTheConfirmationWord()
    {
        var accounts = new Accounts();
        accounts.User.PasswordHash = null;
        var closure = new Closure();

        var result = await Service(accounts, closure).CloseAsync("member", new CloseAccountRequest(null, " XÓA "), default);

        Assert.True(result.Succeeded);
        Assert.Same(accounts.User, closure.Closed);
    }

    [Fact]
    public async Task SignOutEverywhereAsync_RevokesEverySession()
    {
        var closure = new Closure();

        var result = await Service(new Accounts(), closure).SignOutEverywhereAsync("member", default);

        Assert.True(result.Succeeded);
        Assert.Equal("member", closure.SignedOut?.Id);
    }

    private static AccountClosureService Service(Accounts accounts, Closure closure) =>
        new(accounts, closure, new NoAvatar(), TimeProvider.System);

    private sealed class Closure : IAccountClosureRepository
    {
        public ApplicationUser? Closed { get; private set; }
        public ApplicationUser? SignedOut { get; private set; }
        public Task SignOutEverywhereAsync(ApplicationUser user, DateTimeOffset now, CancellationToken cancellationToken)
        {
            SignedOut = user;
            return Task.CompletedTask;
        }
        public Task CloseAsync(ApplicationUser user, DateTimeOffset now, CancellationToken cancellationToken)
        {
            Closed = user;
            return Task.CompletedTask;
        }
    }

    private sealed class NoAvatar : IAvatarService
    {
        public Task<Result<CurrentUserDto>> UpdateAsync(string userId, IFormFile file, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<Result<CurrentUserDto>> DeleteAsync(string userId, CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    private sealed class Accounts : IAccountRepository
    {
        public ApplicationUser User { get; } = new() { Id = "member", DisplayName = "Thành viên", PasswordHash = "hash" };
        public bool PasswordIsRight { get; init; } = true;
        public IReadOnlyList<string> Roles { get; init; } = [RoleNames.Member];
        public Task<ApplicationUser?> FindByIdAsync(string userId) => Task.FromResult<ApplicationUser?>(userId == User.Id ? User : null);
        public Task<bool> HasPasswordAsync(ApplicationUser user) => Task.FromResult(user.PasswordHash is not null);
        public Task<SignInResult> CheckPasswordAsync(ApplicationUser user, string password) =>
            Task.FromResult(PasswordIsRight ? SignInResult.Success : SignInResult.Failed);
        public Task<IReadOnlyList<string>> GetRolesAsync(ApplicationUser user) => Task.FromResult(Roles);
        public Task<ApplicationUser?> FindByEmailAsync(string email) => throw new NotSupportedException();
        public Task<IdentityResult> CreateMemberAsync(ApplicationUser user, string password) => throw new NotSupportedException();
        public Task<IdentityResult> CreateExternalMemberAsync(ApplicationUser user, string provider, string providerKey) => throw new NotSupportedException();
        public Task<ApplicationUser?> FindByLoginAsync(string provider, string providerKey) => throw new NotSupportedException();
        public Task<IdentityResult> AddLoginAsync(ApplicationUser user, string provider, string providerKey) => throw new NotSupportedException();
        public Task<IdentityResult> ClaimByVerifiedEmailAsync(ApplicationUser user) => throw new NotSupportedException();
        public Task<IReadOnlyList<string>> GetLoginProvidersAsync(ApplicationUser user) => throw new NotSupportedException();
        public Task<IdentityResult> AddPasswordAsync(ApplicationUser user, string password) => throw new NotSupportedException();
        public Task<string> GenerateEmailConfirmationTokenAsync(ApplicationUser user) => throw new NotSupportedException();
        public Task<IdentityResult> ConfirmEmailAsync(ApplicationUser user, string token) => throw new NotSupportedException();
        public Task<bool> IsLockedOutAsync(ApplicationUser user) => throw new NotSupportedException();
        public Task<IdentityResult> UpdateAsync(ApplicationUser user) => throw new NotSupportedException();
        public Task<IdentityResult> ChangePasswordAsync(ApplicationUser user, string currentPassword, string newPassword) => throw new NotSupportedException();
    }
}
