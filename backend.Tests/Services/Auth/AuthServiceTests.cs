using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using TechForum.Api.Configuration;
using TechForum.Api.Constants;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos.Auth;
using TechForum.Api.Enums;
using TechForum.Api.Models;
using TechForum.Api.Services;
using TechForum.Api.Tests.Fakes;
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
        Assert.Equal([RoleNames.Member], result.Value!.User.Roles);
        Assert.NotNull(result.Value!.Tokens);
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
        Assert.Equal(ErrorType.Conflict, result.Error);
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
        Assert.Equal(ErrorType.Validation, result.Error);
        Assert.Equal("Mật khẩu cần ít nhất một chữ số.", result.Errors!["password"][0]);
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
        Assert.NotNull(result.Value!.Tokens);
        Assert.NotEmpty(result.Value!.Tokens.AccessToken);
        Assert.Equal(CurrentTime.AddMinutes(15), result.Value!.Tokens.AccessTokenExpiresAtUtc);
        var stored = Assert.Single(refreshTokens.Tokens);
        Assert.NotEqual(result.Value!.Tokens.RefreshToken, stored.TokenHash);
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

        Assert.Equal(CurrentTime.AddDays(expectedDays), result.Value!.Tokens.RefreshTokenExpiresAtUtc);
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

        Assert.Equal(ErrorType.Unauthorized, result.Error);
        Assert.Null(result.Value);
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
        Assert.Equal(ErrorType.Locked, result.Error);
    }

    [Fact]
    public async Task RefreshAsync_RotatesTokenAndKeepsTheSameLifetime()
    {
        var (service, _, refreshTokens, firstTokens) = await LoginAsync(rememberMe: true);

        var result = await service.RefreshAsync(firstTokens.RefreshToken, CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.NotEqual(firstTokens.RefreshToken, result.Value!.Tokens.RefreshToken);
        Assert.Equal(CurrentTime.AddDays(7), result.Value!.Tokens.RefreshTokenExpiresAtUtc);
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

        Assert.Equal(ErrorType.Unauthorized, replay.Error);
        Assert.All(refreshTokens.Tokens, token => Assert.NotNull(token.RevokedAtUtc));
        var stolenCopyResult = await service.RefreshAsync(rotated.Value!.Tokens.RefreshToken, CancellationToken.None);
        Assert.Equal(ErrorType.Unauthorized, stolenCopyResult.Error);
    }

    [Fact]
    public async Task RefreshAsync_WhenOldTokenIsUsedAgain_WritesAWarningWithTheAccountId()
    {
        var user = CreateUser();
        var repository = new FakeAccountRepository();
        repository.UsersByEmail[user.Email!] = user;
        var refreshTokens = new FakeRefreshTokenRepository();
        var logger = new CapturingLogger<AuthService>();
        var service = CreateService(repository, refreshTokens, logger: logger);
        var login = await service.LoginAsync(
            new LoginRequest { Email = user.Email!, Password = "TechForum!2026", RememberMe = true },
            CancellationToken.None);
        await service.RefreshAsync(login.Value!.Tokens.RefreshToken, CancellationToken.None);

        await service.RefreshAsync(login.Value!.Tokens.RefreshToken, CancellationToken.None);

        var warning = Assert.Single(logger.Entries, entry => entry.Level == LogLevel.Warning);
        Assert.Contains(user.Id, warning.Message);
        Assert.DoesNotContain(login.Value!.Tokens.RefreshToken, warning.Message);
    }

    [Fact]
    public async Task RefreshAsync_WhenTokenIsValid_WritesNoWarning()
    {
        var user = CreateUser();
        var repository = new FakeAccountRepository();
        repository.UsersByEmail[user.Email!] = user;
        var logger = new CapturingLogger<AuthService>();
        var service = CreateService(repository, new FakeRefreshTokenRepository(), logger: logger);
        var login = await service.LoginAsync(
            new LoginRequest { Email = user.Email!, Password = "TechForum!2026" },
            CancellationToken.None);

        await service.RefreshAsync(login.Value!.Tokens.RefreshToken, CancellationToken.None);

        Assert.Empty(logger.Entries);
    }

    [Fact]
    public async Task RefreshAsync_WhenTokenIsUnknownOrMissing_ReturnsInvalidRefreshToken()
    {
        var (service, _, _, _) = await LoginAsync(rememberMe: false);

        var unknown = await service.RefreshAsync("not-a-real-token", CancellationToken.None);
        var missing = await service.RefreshAsync(null, CancellationToken.None);

        Assert.Equal(ErrorType.Unauthorized, unknown.Error);
        Assert.Equal(ErrorType.Unauthorized, missing.Error);
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

        Assert.Equal(ErrorType.Unauthorized, result.Error);
    }

    [Fact]
    public async Task RefreshAsync_WhenAccountIsLocked_RevokesTokensAndReturnsLockedOut()
    {
        var (service, repository, refreshTokens, firstTokens) = await LoginAsync(rememberMe: true);
        repository.IsLockedOut = true;

        var result = await service.RefreshAsync(firstTokens.RefreshToken, CancellationToken.None);

        Assert.Equal(ErrorType.Locked, result.Error);
        Assert.All(refreshTokens.Tokens, token => Assert.NotNull(token.RevokedAtUtc));
    }

    [Fact]
    public async Task RefreshAsync_WhenAnotherRequestAlreadyRotatedTheToken_ReturnsInvalidRefreshToken()
    {
        var (service, _, refreshTokens, firstTokens) = await LoginAsync(rememberMe: true);
        refreshTokens.RotateResult = false;

        var result = await service.RefreshAsync(firstTokens.RefreshToken, CancellationToken.None);

        Assert.Equal(ErrorType.Unauthorized, result.Error);
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
        Assert.Equal("Thành viên đã cập nhật", result.Value!.DisplayName);
        Assert.Equal("Chia sẻ kiến thức React và .NET.", result.Value.Bio);
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
        Assert.Equal("Tên hiển thị phải từ 2 đến 80 ký tự.", result.Message);
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
        Assert.Equal("Mật khẩu hiện tại không chính xác.", result.Errors!["currentPassword"][0]);
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
        return (service, repository, refreshTokens, result.Value!.Tokens);
    }

    [Fact]
    public async Task LoginWithGoogleAsync_WhenGoogleIsNotSetUp_IsUnavailable()
    {
        var service = CreateService(new FakeAccountRepository(), new FakeRefreshTokenRepository(),
            google: new FakeGoogleValidator { Configured = false });

        var result = await service.LoginWithGoogleAsync("token", CancellationToken.None);

        Assert.Equal(ErrorType.Unavailable, result.Error);
    }

    [Fact]
    public async Task LoginWithGoogleAsync_WithATokenGoogleDoesNotAccept_IsRefused()
    {
        var service = CreateService(new FakeAccountRepository(), new FakeRefreshTokenRepository(),
            google: new FakeGoogleValidator { Identity = null });

        var result = await service.LoginWithGoogleAsync("forged", CancellationToken.None);

        Assert.Equal(ErrorType.Unauthorized, result.Error);
    }

    [Fact]
    public async Task LoginWithGoogleAsync_WithAnEmailGoogleDidNotVerify_IsRefused()
    {
        var repository = new FakeAccountRepository();
        var service = CreateService(repository, new FakeRefreshTokenRepository(),
            google: new FakeGoogleValidator { Identity = new GoogleIdentity("g-1", "new@gmail.com", false, "Người mới") });

        var result = await service.LoginWithGoogleAsync("token", CancellationToken.None);

        Assert.Equal(ErrorType.Unauthorized, result.Error);
        Assert.Null(repository.CreatedUser);
    }

    [Fact]
    public async Task LoginWithGoogleAsync_ForANewEmail_CreatesAMemberWithoutPasswordAndSignsIn()
    {
        var repository = new FakeAccountRepository();
        var refreshTokens = new FakeRefreshTokenRepository();
        var service = CreateService(repository, refreshTokens,
            google: new FakeGoogleValidator { Identity = new GoogleIdentity("g-1", "new@gmail.com", true, "Người Mới") });

        var result = await service.LoginWithGoogleAsync("token", CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal("Người Mới", repository.CreatedUser!.DisplayName);
        Assert.True(repository.CreatedUser.EmailConfirmed);
        Assert.Null(repository.CreatedUser.PasswordHash);
        Assert.Same(repository.CreatedUser, repository.Logins[("Google", "g-1")]);
        Assert.NotEmpty(result.Value!.Tokens.AccessToken);
        Assert.Single(refreshTokens.Tokens);
    }

    [Fact]
    public async Task LoginWithGoogleAsync_ForALinkedAccount_SignsInWithoutChangingIt()
    {
        var repository = new FakeAccountRepository();
        var user = CreateUser();
        user.EmailConfirmed = true;
        repository.UsersByEmail[user.Email!] = user;
        repository.Logins[("Google", "g-1")] = user;
        var service = CreateService(repository, new FakeRefreshTokenRepository(),
            google: new FakeGoogleValidator { Identity = new GoogleIdentity("g-1", user.Email!, true, "Khác") });

        var result = await service.LoginWithGoogleAsync("token", CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal(user.Id, result.Value!.User.Id);
        Assert.Null(repository.CreatedUser);
        Assert.Empty(repository.Claimed);
    }

    // Ai đó có thể đã đăng ký trước bằng email này và đặt mật khẩu; chủ email thật đăng nhập Google thì mật khẩu đó bị bỏ.
    [Fact]
    public async Task LoginWithGoogleAsync_ForAnUnverifiedAccountWithTheSameEmail_DropsItsPasswordAndSignsOutOldSessions()
    {
        var repository = new FakeAccountRepository();
        var refreshTokens = new FakeRefreshTokenRepository();
        var user = CreateUser();
        user.PasswordHash = "set-by-someone";
        repository.UsersByEmail[user.Email!] = user;
        var service = CreateService(repository, refreshTokens,
            google: new FakeGoogleValidator { Identity = new GoogleIdentity("g-1", user.Email!, true, "Chủ email") });

        var result = await service.LoginWithGoogleAsync("token", CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Same(user, Assert.Single(repository.Claimed));
        Assert.Null(user.PasswordHash);
        Assert.True(user.EmailConfirmed);
        Assert.Same(user, repository.Logins[("Google", "g-1")]);
        Assert.Equal(1, refreshTokens.RevokeAllCount);
    }

    [Fact]
    public async Task LoginWithGoogleAsync_ForALockedAccount_IsLocked()
    {
        var repository = new FakeAccountRepository { IsLockedOut = true };
        var user = CreateUser();
        repository.UsersByEmail[user.Email!] = user;
        repository.Logins[("Google", "g-1")] = user;
        var service = CreateService(repository, new FakeRefreshTokenRepository(),
            google: new FakeGoogleValidator { Identity = new GoogleIdentity("g-1", user.Email!, true, "Bị khóa") });

        var result = await service.LoginWithGoogleAsync("token", CancellationToken.None);

        Assert.Equal(ErrorType.Locked, result.Error);
    }

    private sealed class FakeGoogleValidator : IGoogleTokenValidator
    {
        public bool Configured { get; init; } = true;

        public GoogleIdentity? Identity { get; init; }

        public bool IsConfigured => Configured;

        public Task<GoogleIdentity?> ValidateAsync(string credential) => Task.FromResult(Identity);
    }

    [Fact]
    public async Task SetPasswordAsync_ForAnAccountWithoutPassword_SetsItAndSignsOutEveryDevice()
    {
        var repository = new FakeAccountRepository();
        var refreshTokens = new FakeRefreshTokenRepository();
        var user = CreateUser();
        user.PasswordHash = null;
        repository.UsersByEmail[user.Email!] = user;
        repository.Logins[("Google", "g-1")] = user;

        var result = await CreateService(repository, refreshTokens).SetPasswordAsync(
            user.Id, new SetPasswordRequest { NewPassword = "MatKhauMoi!1" }, CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.True(result.Value!.HasPassword);
        Assert.True(result.Value.IsGoogleLinked);
        Assert.Equal("hash-of-MatKhauMoi!1", user.PasswordHash);
        Assert.Equal(1, refreshTokens.RevokeAllCount);
    }

    [Fact]
    public async Task SetPasswordAsync_WhenTheAccountAlreadyHasAPassword_IsAConflict()
    {
        var repository = new FakeAccountRepository();
        var user = CreateUser();
        user.PasswordHash = "existing";
        repository.UsersByEmail[user.Email!] = user;

        var result = await CreateService(repository, new FakeRefreshTokenRepository()).SetPasswordAsync(
            user.Id, new SetPasswordRequest { NewPassword = "MatKhauMoi!1" }, CancellationToken.None);

        Assert.Equal(ErrorType.Conflict, result.Error);
        Assert.Equal("existing", user.PasswordHash);
    }

    [Fact]
    public async Task SetPasswordAsync_WithAWeakPassword_TellsWhatIsMissing()
    {
        var repository = new FakeAccountRepository
        {
            AddPasswordResult = IdentityResult.Failed(new IdentityError { Code = "PasswordRequiresDigit" })
        };
        var refreshTokens = new FakeRefreshTokenRepository();
        var user = CreateUser();
        user.PasswordHash = null;
        repository.UsersByEmail[user.Email!] = user;

        var result = await CreateService(repository, refreshTokens).SetPasswordAsync(
            user.Id, new SetPasswordRequest { NewPassword = "khongcoso!" }, CancellationToken.None);

        Assert.Equal(ErrorType.Validation, result.Error);
        Assert.Equal("Mật khẩu cần ít nhất một chữ số.", result.Errors!["newPassword"][0]);
        Assert.Equal(0, refreshTokens.RevokeAllCount);
    }

    [Fact]
    public async Task Login_TellsThatTheAccountHasAPasswordAndNoGoogleLink()
    {
        var repository = new FakeAccountRepository();
        var user = CreateUser();
        user.PasswordHash = "existing";
        repository.UsersByEmail[user.Email!] = user;

        var result = await CreateService(repository, new FakeRefreshTokenRepository()).LoginAsync(
            new LoginRequest { Email = user.Email!, Password = "DungMatKhau!1" }, CancellationToken.None);

        Assert.True(result.Value!.User.HasPassword);
        Assert.False(result.Value.User.IsGoogleLinked);
    }

    private static AuthService CreateService(
        FakeAccountRepository repository,
        FakeRefreshTokenRepository refreshTokens,
        TimeProvider? timeProvider = null,
        ILogger<AuthService>? logger = null,
        FakeGoogleValidator? google = null)
    {
        var clock = timeProvider ?? new FixedTimeProvider(CurrentTime);
        var optionsAccessor = Microsoft.Extensions.Options.Options.Create(Options);
        return new AuthService(
            repository,
            refreshTokens,
            new TokenService(optionsAccessor, clock),
            optionsAccessor,
            logger ?? NullLogger<AuthService>.Instance,
            clock,
            google ?? new FakeGoogleValidator());
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

        public Dictionary<(string Provider, string Key), ApplicationUser> Logins { get; } = [];

        public List<ApplicationUser> Claimed { get; } = [];

        public IdentityResult AddPasswordResult { get; init; } = IdentityResult.Success;

        public Task<bool> HasPasswordAsync(ApplicationUser user) => Task.FromResult(user.PasswordHash is not null);

        public Task<IReadOnlyList<string>> GetLoginProvidersAsync(ApplicationUser user)
        {
            IReadOnlyList<string> providers = Logins.Where(item => item.Value == user).Select(item => item.Key.Provider).ToList();
            return Task.FromResult(providers);
        }

        public Task<IdentityResult> AddPasswordAsync(ApplicationUser user, string password)
        {
            if (AddPasswordResult.Succeeded)
            {
                user.PasswordHash = "hash-of-" + password;
            }
            return Task.FromResult(AddPasswordResult);
        }

        public Task<IdentityResult> CreateExternalMemberAsync(ApplicationUser user, string provider, string providerKey)
        {
            user.Id = "google-member";
            CreatedUser = user;
            UsersByEmail[user.Email!] = user;
            Logins[(provider, providerKey)] = user;
            return Task.FromResult(IdentityResult.Success);
        }

        public Task<ApplicationUser?> FindByLoginAsync(string provider, string providerKey)
        {
            Logins.TryGetValue((provider, providerKey), out var user);
            return Task.FromResult(user);
        }

        public Task<IdentityResult> AddLoginAsync(ApplicationUser user, string provider, string providerKey)
        {
            Logins[(provider, providerKey)] = user;
            return Task.FromResult(IdentityResult.Success);
        }

        public Task<IdentityResult> ClaimByVerifiedEmailAsync(ApplicationUser user)
        {
            user.PasswordHash = null;
            user.EmailConfirmed = true;
            Claimed.Add(user);
            return Task.FromResult(IdentityResult.Success);
        }

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
