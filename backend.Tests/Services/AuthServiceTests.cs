using Microsoft.AspNetCore.Identity;
using TechForum.Api.Constants;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos.Auth;
using TechForum.Api.Enums;
using TechForum.Api.Models;
using TechForum.Api.Services;
using Xunit;

namespace TechForum.Api.Tests.Services;

public sealed class AuthServiceTests
{
    private static readonly DateTimeOffset CurrentTime =
        new(2026, 10, 3, 8, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task RegisterAsync_CreatesMemberWithNormalizedInput()
    {
        var repository = new FakeAccountRepository();
        var service = CreateService(repository);

        var result = await service.RegisterAsync(new RegisterRequest
        {
            DisplayName = "  Thành viên A  ",
            Email = "  member.a@techforum.local  ",
            Password = "TechForum!2026"
        });

        Assert.True(result.Succeeded);
        Assert.NotNull(repository.CreatedUser);
        Assert.Equal("Thành viên A", repository.CreatedUser.DisplayName);
        Assert.Equal("member.a@techforum.local", repository.CreatedUser.Email);
        Assert.Equal(CurrentTime, repository.CreatedUser.CreatedAtUtc);
        Assert.Equal([RoleNames.Member], result.User!.Roles);
        Assert.True(repository.WasSignedIn);
    }

    [Fact]
    public async Task RegisterAsync_WhenEmailExists_ReturnsDuplicateEmail()
    {
        var repository = new FakeAccountRepository();
        repository.UsersByEmail["member.a@techforum.local"] = CreateUser();
        var service = CreateService(repository);

        var result = await service.RegisterAsync(new RegisterRequest
        {
            DisplayName = "Thành viên khác",
            Email = "member.a@techforum.local",
            Password = "TechForum!2026"
        });

        Assert.False(result.Succeeded);
        Assert.Equal(AuthFailureKind.DuplicateEmail, result.Failure);
        Assert.Null(repository.CreatedUser);
    }

    [Fact]
    public async Task RegisterAsync_WhenPasswordRejected_ReturnsVietnameseValidationError()
    {
        var repository = new FakeAccountRepository
        {
            CreateResult = IdentityResult.Failed(new IdentityError
            {
                Code = "PasswordRequiresDigit",
                Description = "Password requires a digit."
            })
        };
        var service = CreateService(repository);

        var result = await service.RegisterAsync(new RegisterRequest
        {
            DisplayName = "Thành viên A",
            Email = "member.a@techforum.local",
            Password = "Password!"
        });

        Assert.False(result.Succeeded);
        Assert.Equal(AuthFailureKind.Validation, result.Failure);
        Assert.Equal("Mật khẩu cần ít nhất một chữ số.", result.Errors["password"][0]);
    }

    [Fact]
    public async Task LoginAsync_WhenAccountLocked_ReturnsLockedOut()
    {
        var user = CreateUser();
        var repository = new FakeAccountRepository
        {
            PasswordSignInResult = SignInResult.LockedOut
        };
        repository.UsersByEmail[user.Email!] = user;
        var service = CreateService(repository);

        var result = await service.LoginAsync(new LoginRequest
        {
            Email = user.Email!,
            Password = "TechForum!2026"
        });

        Assert.False(result.Succeeded);
        Assert.Equal(AuthFailureKind.LockedOut, result.Failure);
    }

    [Fact]
    public async Task UpdateProfileAsync_TrimsNameAndRefreshesCurrentSession()
    {
        var user = CreateUser();
        var repository = new FakeAccountRepository();
        repository.UsersByEmail[user.Email!] = user;
        var service = CreateService(repository);

        var result = await service.UpdateProfileAsync(user.Id, new UpdateProfileRequest
        {
            DisplayName = "  Thành viên đã cập nhật  ",
            Bio = "  Chia sẻ kiến thức React và .NET.  "
        });

        Assert.True(result.Succeeded);
        Assert.Equal("Thành viên đã cập nhật", user.DisplayName);
        Assert.Equal("Thành viên đã cập nhật", result.User!.DisplayName);
        Assert.Equal("Chia sẻ kiến thức React và .NET.", result.User.Bio);
        Assert.True(repository.WasSessionRefreshed);
    }

    [Fact]
    public async Task UpdateProfileAsync_WhenNameIsWhitespace_ReturnsFieldError()
    {
        var repository = new FakeAccountRepository();
        var service = CreateService(repository);

        var result = await service.UpdateProfileAsync("member-a", new UpdateProfileRequest
        {
            DisplayName = "  "
        });

        Assert.False(result.Succeeded);
        Assert.Equal("Tên hiển thị phải từ 2 đến 80 ký tự.", result.Errors["displayName"][0]);
        Assert.False(repository.WasSessionRefreshed);
    }

    [Fact]
    public async Task ChangePasswordAsync_WhenCurrentPasswordIsWrong_ReturnsFieldError()
    {
        var user = CreateUser();
        var repository = new FakeAccountRepository
        {
            ChangePasswordResult = IdentityResult.Failed(new IdentityError
            {
                Code = "PasswordMismatch",
                Description = "Incorrect password."
            })
        };
        repository.UsersByEmail[user.Email!] = user;
        var service = CreateService(repository);

        var result = await service.ChangePasswordAsync(user.Id, new ChangePasswordRequest
        {
            CurrentPassword = "SaiMatKhau!1",
            NewPassword = "MatKhauMoi!2026"
        });

        Assert.False(result.Succeeded);
        Assert.Equal("Mật khẩu hiện tại không chính xác.", result.Errors["currentPassword"][0]);
        Assert.False(repository.WasSessionRefreshed);
    }

    [Fact]
    public async Task ChangePasswordAsync_WhenSuccessful_RefreshesCurrentSession()
    {
        var user = CreateUser();
        var repository = new FakeAccountRepository();
        repository.UsersByEmail[user.Email!] = user;
        var service = CreateService(repository);

        var result = await service.ChangePasswordAsync(user.Id, new ChangePasswordRequest
        {
            CurrentPassword = "TechForum!2026",
            NewPassword = "MatKhauMoi!2026"
        });

        Assert.True(result.Succeeded);
        Assert.True(repository.WasSessionRefreshed);
        Assert.Equal("TechForum!2026", repository.LastCurrentPassword);
        Assert.Equal("MatKhauMoi!2026", repository.LastNewPassword);
    }

    private static AuthService CreateService(FakeAccountRepository repository) =>
        new(repository, new FixedTimeProvider(CurrentTime));

    private static ApplicationUser CreateUser() => new()
    {
        Id = "member-a",
        UserName = "member.a@techforum.local",
        Email = "member.a@techforum.local",
        DisplayName = "Thành viên A",
        CreatedAtUtc = CurrentTime
    };

    private sealed class FixedTimeProvider(DateTimeOffset currentTime) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => currentTime;
    }

    private sealed class FakeAccountRepository : IAccountRepository
    {
        public Dictionary<string, ApplicationUser> UsersByEmail { get; } =
            new(StringComparer.OrdinalIgnoreCase);

        public IdentityResult CreateResult { get; init; } = IdentityResult.Success;

        public SignInResult PasswordSignInResult { get; init; } = SignInResult.Success;

        public IdentityResult UpdateResult { get; init; } = IdentityResult.Success;

        public IdentityResult ChangePasswordResult { get; init; } = IdentityResult.Success;

        public ApplicationUser? CreatedUser { get; private set; }

        public bool WasSignedIn { get; private set; }

        public bool WasSessionRefreshed { get; private set; }

        public string? LastCurrentPassword { get; private set; }

        public string? LastNewPassword { get; private set; }

        public Task<ApplicationUser?> FindByEmailAsync(string email)
        {
            UsersByEmail.TryGetValue(email, out var user);
            return Task.FromResult(user);
        }

        public Task<ApplicationUser?> FindByIdAsync(string userId) =>
            Task.FromResult(UsersByEmail.Values.SingleOrDefault(user => user.Id == userId));

        public Task<IdentityResult> CreateMemberAsync(ApplicationUser user, string password)
        {
            CreatedUser = user;
            return Task.FromResult(CreateResult);
        }

        public Task<SignInResult> PasswordSignInAsync(
            ApplicationUser user,
            string password,
            bool rememberMe) =>
            Task.FromResult(PasswordSignInResult);

        public Task SignInAsync(ApplicationUser user)
        {
            WasSignedIn = true;
            return Task.CompletedTask;
        }

        public Task SignOutAsync() => Task.CompletedTask;

        public Task<IReadOnlyList<string>> GetRolesAsync(ApplicationUser user) =>
            Task.FromResult<IReadOnlyList<string>>([RoleNames.Member]);

        public Task<IdentityResult> UpdateAsync(ApplicationUser user) =>
            Task.FromResult(UpdateResult);

        public Task<IdentityResult> ChangePasswordAsync(
            ApplicationUser user,
            string currentPassword,
            string newPassword)
        {
            LastCurrentPassword = currentPassword;
            LastNewPassword = newPassword;
            return Task.FromResult(ChangePasswordResult);
        }

        public Task RefreshSignInAsync(ApplicationUser user)
        {
            WasSessionRefreshed = true;
            return Task.CompletedTask;
        }
    }
}
