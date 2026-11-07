using Microsoft.AspNetCore.Identity;
using TechForum.Api.Configuration;
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

    private static readonly JwtOptions Options = new()
    {
        SigningKey = "unit-test-signing-key-with-at-least-32-chars",
        AccessTokenMinutes = 15,
        RefreshTokenDays = 7,
        ShortRefreshTokenDays = 1
    };

    [Fact]
    public async Task RegisterAsync_CreatesMemberWithNormalizedInput()
    {
        var repository = new FakeAccountRepository();
        var service = CreateService(repository, new FakeRefreshTokenRepository());

        var result = await service.RegisterAsync(new RegisterRequest
        {
            DisplayName = "  Thành viên A  ",
            Email = "  member.a@techforum.local  ",
            Password = "TechForum!2026"
        }, CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.NotNull(repository.CreatedUser);
        Assert.Equal("Thành viên A", repository.CreatedUser.DisplayName);
        Assert.Equal("member.a@techforum.local", repository.CreatedUser.Email);
        Assert.Equal(CurrentTime, repository.CreatedUser.CreatedAtUtc);
        Assert.Equal([RoleNames.Member], result.User!.Roles);
        Assert.NotNull(result.Tokens);
    }

    [Fact]
    public async Task RegisterAsync_WhenEmailExists_ReturnsDuplicateEmail()
    {
        var repository = new FakeAccountRepository();
        repository.UsersByEmail["member.a@techforum.local"] = CreateUser();
        var service = CreateService(repository, new FakeRefreshTokenRepository());

        var result = await service.RegisterAsync(new RegisterRequest
        {
            DisplayName = "Thành viên khác",
            Email = "member.a@techforum.local",
            Password = "TechForum!2026"
        }, CancellationToken.None);

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
        var service = CreateService(repository, new FakeRefreshTokenRepository());

        var result = await service.RegisterAsync(new RegisterRequest
        {
            DisplayName = "Thành viên A",
            Email = "member.a@techforum.local",
            Password = "Password!"
        }, CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Equal(AuthFailureKind.Validation, result.Failure);
        Assert.Equal("Mật khẩu cần ít nhất một chữ số.", result.Errors["password"][0]);
    }

    [Fact]
    public async Task LoginAsync_WhenCredentialsAreValid_ReturnsTokensAndStoresOnlyTheHash()
    {
        var user = CreateUser();
        var repository = new FakeAccountRepository();
        repository.UsersByEmail[user.Email!] = user;
        var refreshTokens = new FakeRefreshTokenRepository();
        var service = CreateService(repository, refreshTokens);

        var result = await service.LoginAsync(
            new LoginRequest { Email = user.Email!, Password = "TechForum!2026" },
            CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.NotNull(result.Tokens);
        Assert.NotEmpty(result.Tokens.AccessToken);
        Assert.Equal(CurrentTime.AddMinutes(15), result.Tokens.AccessTokenExpiresAtUtc);
        var stored = Assert.Single(refreshTokens.Tokens);
        Assert.NotEqual(result.Tokens.RefreshToken, stored.TokenHash);
        Assert.Equal(user.Id, stored.UserId);
    }

    [Theory]
    [InlineData(true, 7)]
    [InlineData(false, 1)]
    public async Task LoginAsync_UsesRefreshTokenLifetimeFromRememberMe(bool rememberMe, int expectedDays)
    {
        var user = CreateUser();
        var repository = new FakeAccountRepository();
        repository.UsersByEmail[user.Email!] = user;
        var service = CreateService(repository, new FakeRefreshTokenRepository());

        var result = await service.LoginAsync(
            new LoginRequest { Email = user.Email!, Password = "TechForum!2026", RememberMe = rememberMe },
            CancellationToken.None);

        Assert.Equal(CurrentTime.AddDays(expectedDays), result.Tokens!.RefreshTokenExpiresAtUtc);
    }

    [Fact]
    public async Task LoginAsync_WhenPasswordIsWrong_ReturnsInvalidCredentialsWithoutTokens()
    {
        var user = CreateUser();
        var repository = new FakeAccountRepository { CheckPasswordResult = SignInResult.Failed };
        repository.UsersByEmail[user.Email!] = user;
        var refreshTokens = new FakeRefreshTokenRepository();
        var service = CreateService(repository, refreshTokens);

        var result = await service.LoginAsync(
            new LoginRequest { Email = user.Email!, Password = "SaiMatKhau!1" },
            CancellationToken.None);

        Assert.Equal(AuthFailureKind.InvalidCredentials, result.Failure);
        Assert.Null(result.Tokens);
        Assert.Empty(refreshTokens.Tokens);
    }

    [Fact]
    public async Task LoginAsync_WhenAccountLocked_ReturnsLockedOut()
    {
        var user = CreateUser();
        var repository = new FakeAccountRepository
        {
            CheckPasswordResult = SignInResult.LockedOut
        };
        repository.UsersByEmail[user.Email!] = user;
        var service = CreateService(repository, new FakeRefreshTokenRepository());

        var result = await service.LoginAsync(
            new LoginRequest { Email = user.Email!, Password = "TechForum!2026" },
            CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Equal(AuthFailureKind.LockedOut, result.Failure);
    }

    [Fact]
    public async Task RefreshAsync_RotatesTokenAndKeepsTheSameLifetime()
    {
        var (service, _, refreshTokens, firstTokens) = await LoginAsync(rememberMe: true);

        var result = await service.RefreshAsync(firstTokens.RefreshToken, CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.NotEqual(firstTokens.RefreshToken, result.Tokens!.RefreshToken);
        Assert.Equal(CurrentTime.AddDays(7), result.Tokens.RefreshTokenExpiresAtUtc);
        Assert.Equal(2, refreshTokens.Tokens.Count);
        var oldToken = refreshTokens.Tokens[0];
        var newToken = refreshTokens.Tokens[1];
        Assert.NotNull(oldToken.RevokedAtUtc);
        Assert.Equal(newToken.TokenHash, oldToken.ReplacedByTokenHash);
        Assert.Null(newToken.RevokedAtUtc);
    }

    [Fact]
    public async Task RefreshAsync_WhenOldTokenIsUsedAgain_RevokesEveryTokenOfTheUser()
    {
        var (service, _, refreshTokens, firstTokens) = await LoginAsync(rememberMe: true);
        var rotated = await service.RefreshAsync(firstTokens.RefreshToken, CancellationToken.None);
        Assert.True(rotated.Succeeded);

        var replay = await service.RefreshAsync(firstTokens.RefreshToken, CancellationToken.None);

        Assert.Equal(AuthFailureKind.InvalidRefreshToken, replay.Failure);
        Assert.All(refreshTokens.Tokens, token => Assert.NotNull(token.RevokedAtUtc));
        var stolenCopyResult = await service.RefreshAsync(rotated.Tokens!.RefreshToken, CancellationToken.None);
        Assert.Equal(AuthFailureKind.InvalidRefreshToken, stolenCopyResult.Failure);
    }

    [Fact]
    public async Task RefreshAsync_WhenTokenIsUnknownOrMissing_ReturnsInvalidRefreshToken()
    {
        var (service, _, _, _) = await LoginAsync(rememberMe: false);

        var unknown = await service.RefreshAsync("not-a-real-token", CancellationToken.None);
        var missing = await service.RefreshAsync(null, CancellationToken.None);

        Assert.Equal(AuthFailureKind.InvalidRefreshToken, unknown.Failure);
        Assert.Equal(AuthFailureKind.InvalidRefreshToken, missing.Failure);
    }

    [Fact]
    public async Task RefreshAsync_WhenTokenExpired_ReturnsInvalidRefreshToken()
    {
        var (_, repository, refreshTokens, firstTokens) = await LoginAsync(rememberMe: false);
        var laterService = CreateService(
            repository,
            refreshTokens,
            new FixedTimeProvider(CurrentTime.AddDays(2)));

        var result = await laterService.RefreshAsync(firstTokens.RefreshToken, CancellationToken.None);

        Assert.Equal(AuthFailureKind.InvalidRefreshToken, result.Failure);
    }

    [Fact]
    public async Task RefreshAsync_WhenAccountIsLocked_RevokesTokensAndReturnsLockedOut()
    {
        var (service, repository, refreshTokens, firstTokens) = await LoginAsync(rememberMe: true);
        repository.IsLockedOut = true;

        var result = await service.RefreshAsync(firstTokens.RefreshToken, CancellationToken.None);

        Assert.Equal(AuthFailureKind.LockedOut, result.Failure);
        Assert.All(refreshTokens.Tokens, token => Assert.NotNull(token.RevokedAtUtc));
    }

    [Fact]
    public async Task RefreshAsync_WhenAnotherRequestAlreadyRotatedTheToken_ReturnsInvalidRefreshToken()
    {
        var (service, _, refreshTokens, firstTokens) = await LoginAsync(rememberMe: true);
        refreshTokens.RotateResult = false;

        var result = await service.RefreshAsync(firstTokens.RefreshToken, CancellationToken.None);

        Assert.Equal(AuthFailureKind.InvalidRefreshToken, result.Failure);
        Assert.Single(refreshTokens.Tokens);
    }

    [Fact]
    public async Task LogoutAsync_RevokesOnlyTheCurrentRefreshToken()
    {
        var (service, _, refreshTokens, firstTokens) = await LoginAsync(rememberMe: true);
        var otherDevice = await service.LoginAsync(
            new LoginRequest { Email = "member.a@techforum.local", Password = "TechForum!2026" },
            CancellationToken.None);

        await service.LogoutAsync(firstTokens.RefreshToken, CancellationToken.None);

        Assert.NotNull(refreshTokens.Tokens[0].RevokedAtUtc);
        Assert.Null(refreshTokens.Tokens[1].RevokedAtUtc);
        Assert.True(otherDevice.Succeeded);
    }

    [Fact]
    public async Task LogoutAsync_WhenCookieIsMissing_DoesNothing()
    {
        var (service, _, refreshTokens, _) = await LoginAsync(rememberMe: true);

        await service.LogoutAsync(null, CancellationToken.None);

        Assert.All(refreshTokens.Tokens, token => Assert.Null(token.RevokedAtUtc));
    }

    [Fact]
    public async Task UpdateProfileAsync_TrimsNameAndReturnsUpdatedUser()
    {
        var user = CreateUser();
        var repository = new FakeAccountRepository();
        repository.UsersByEmail[user.Email!] = user;
        var service = CreateService(repository, new FakeRefreshTokenRepository());

        var result = await service.UpdateProfileAsync(user.Id, new UpdateProfileRequest
        {
            DisplayName = "  Thành viên đã cập nhật  ",
            Bio = "  Chia sẻ kiến thức React và .NET.  "
        });

        Assert.True(result.Succeeded);
        Assert.Equal("Thành viên đã cập nhật", user.DisplayName);
        Assert.Equal("Thành viên đã cập nhật", result.User!.DisplayName);
        Assert.Equal("Chia sẻ kiến thức React và .NET.", result.User.Bio);
        Assert.Null(result.Tokens);
    }

    [Fact]
    public async Task UpdateProfileAsync_WhenNameIsWhitespace_ReturnsFieldError()
    {
        var repository = new FakeAccountRepository();
        var service = CreateService(repository, new FakeRefreshTokenRepository());

        var result = await service.UpdateProfileAsync("member-a", new UpdateProfileRequest
        {
            DisplayName = "  "
        });

        Assert.False(result.Succeeded);
        Assert.Equal("Tên hiển thị phải từ 2 đến 80 ký tự.", result.Errors["displayName"][0]);
        Assert.Equal(0, repository.UpdateCount);
    }

    [Fact]
    public async Task ChangePasswordAsync_WhenCurrentPasswordIsWrong_ReturnsFieldErrorAndKeepsTokens()
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
        var refreshTokens = new FakeRefreshTokenRepository();
        var service = CreateService(repository, refreshTokens);
        await service.LoginAsync(
            new LoginRequest { Email = user.Email!, Password = "TechForum!2026" },
            CancellationToken.None);

        var result = await service.ChangePasswordAsync(user.Id, new ChangePasswordRequest
        {
            CurrentPassword = "SaiMatKhau!1",
            NewPassword = "MatKhauMoi!2026"
        }, CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Equal("Mật khẩu hiện tại không chính xác.", result.Errors["currentPassword"][0]);
        Assert.All(refreshTokens.Tokens, token => Assert.Null(token.RevokedAtUtc));
    }

    [Fact]
    public async Task ChangePasswordAsync_WhenSuccessful_RevokesEveryRefreshToken()
    {
        var user = CreateUser();
        var repository = new FakeAccountRepository();
        repository.UsersByEmail[user.Email!] = user;
        var refreshTokens = new FakeRefreshTokenRepository();
        var service = CreateService(repository, refreshTokens);
        await service.LoginAsync(
            new LoginRequest { Email = user.Email!, Password = "TechForum!2026" },
            CancellationToken.None);
        await service.LoginAsync(
            new LoginRequest { Email = user.Email!, Password = "TechForum!2026" },
            CancellationToken.None);

        var result = await service.ChangePasswordAsync(user.Id, new ChangePasswordRequest
        {
            CurrentPassword = "TechForum!2026",
            NewPassword = "MatKhauMoi!2026"
        }, CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Null(result.Tokens);
        Assert.Equal(2, refreshTokens.Tokens.Count);
        Assert.All(refreshTokens.Tokens, token => Assert.NotNull(token.RevokedAtUtc));
        Assert.Equal("TechForum!2026", repository.LastCurrentPassword);
        Assert.Equal("MatKhauMoi!2026", repository.LastNewPassword);
    }

    [Theory]
    [InlineData(-1, true)]
    [InlineData(1, false)]
    public async Task LoginAsync_ClearsOnlyExpiredModerationReason(int hoursFromNow, bool shouldClear)
    {
        var user = CreateUser();
        user.LockReason = "Vi phạm nội quy";
        user.LockoutEnd = CurrentTime.AddHours(hoursFromNow);
        var repository = new FakeAccountRepository();
        repository.UsersByEmail[user.Email!] = user;
        await CreateService(repository, new FakeRefreshTokenRepository()).LoginAsync(
            new LoginRequest { Email = user.Email!, Password = "TechForum!2026" },
            CancellationToken.None);
        Assert.Equal(shouldClear, user.LockReason is null);
        Assert.Equal(shouldClear ? 1 : 0, repository.UpdateCount);
    }

    private static async Task<(
        AuthService Service,
        FakeAccountRepository Repository,
        FakeRefreshTokenRepository RefreshTokens,
        AuthTokens Tokens)> LoginAsync(bool rememberMe)
    {
        var user = CreateUser();
        var repository = new FakeAccountRepository();
        repository.UsersByEmail[user.Email!] = user;
        var refreshTokens = new FakeRefreshTokenRepository();
        var service = CreateService(repository, refreshTokens);
        var result = await service.LoginAsync(
            new LoginRequest { Email = user.Email!, Password = "TechForum!2026", RememberMe = rememberMe },
            CancellationToken.None);
        return (service, repository, refreshTokens, result.Tokens!);
    }

    private static AuthService CreateService(
        FakeAccountRepository repository,
        FakeRefreshTokenRepository refreshTokens,
        TimeProvider? timeProvider = null)
    {
        var clock = timeProvider ?? new FixedTimeProvider(CurrentTime);
        var optionsAccessor = Microsoft.Extensions.Options.Options.Create(Options);
        return new AuthService(
            repository,
            refreshTokens,
            new TokenService(optionsAccessor, clock),
            optionsAccessor,
            clock);
    }

    private static ApplicationUser CreateUser() => new()
    {
        Id = "member-a",
        UserName = "member.a@techforum.local",
        Email = "member.a@techforum.local",
        DisplayName = "Thành viên A",
        CreatedAtUtc = CurrentTime,
        SecurityStamp = "stamp-a"
    };

    private sealed class FixedTimeProvider(DateTimeOffset currentTime) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => currentTime;
    }

    private sealed class FakeRefreshTokenRepository : IRefreshTokenRepository
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

    private sealed class FakeAccountRepository : IAccountRepository
    {
        public Dictionary<string, ApplicationUser> UsersByEmail { get; } =
            new(StringComparer.OrdinalIgnoreCase);

        public IdentityResult CreateResult { get; init; } = IdentityResult.Success;

        public SignInResult CheckPasswordResult { get; init; } = SignInResult.Success;

        public IdentityResult UpdateResult { get; init; } = IdentityResult.Success;

        public IdentityResult ChangePasswordResult { get; init; } = IdentityResult.Success;

        public bool IsLockedOut { get; set; }

        public ApplicationUser? CreatedUser { get; private set; }

        public string? LastCurrentPassword { get; private set; }

        public string? LastNewPassword { get; private set; }

        public int UpdateCount { get; private set; }

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

        public Task<SignInResult> CheckPasswordAsync(ApplicationUser user, string password) =>
            Task.FromResult(CheckPasswordResult);

        public Task<bool> IsLockedOutAsync(ApplicationUser user) => Task.FromResult(IsLockedOut);

        public Task<IReadOnlyList<string>> GetRolesAsync(ApplicationUser user) =>
            Task.FromResult<IReadOnlyList<string>>([RoleNames.Member]);

        public Task<IdentityResult> UpdateAsync(ApplicationUser user)
        {
            UpdateCount++;
            return Task.FromResult(UpdateResult);
        }

        public Task<IdentityResult> ChangePasswordAsync(
            ApplicationUser user,
            string currentPassword,
            string newPassword)
        {
            LastCurrentPassword = currentPassword;
            LastNewPassword = newPassword;
            return Task.FromResult(ChangePasswordResult);
        }
    }
}
