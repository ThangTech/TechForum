using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos.Auth;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class AuthService : IAuthService
{
    private const string ProfileTitle = "Không thể cập nhật hồ sơ";
    private const string NotSignedInTitle = "Bạn cần đăng nhập";

    private readonly IAccountRepository accountRepository;
    private readonly IRefreshTokenRepository refreshTokenRepository;
    private readonly ITokenService tokenService;
    private readonly IOptions<JwtOptions> jwtOptions;
    private readonly ILogger<AuthService> logger;
    private readonly TimeProvider timeProvider;

    public AuthService(
        IAccountRepository accountRepository,
        IRefreshTokenRepository refreshTokenRepository,
        ITokenService tokenService,
        IOptions<JwtOptions> jwtOptions,
        ILogger<AuthService> logger,
        TimeProvider timeProvider)
    {
        this.accountRepository = accountRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.tokenService = tokenService;
        this.jwtOptions = jwtOptions;
        this.logger = logger;
        this.timeProvider = timeProvider;
    }

    public async Task<Result<AuthSession>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim();
        if (await accountRepository.FindByEmailAsync(email) is not null)
        {
            return DuplicateEmail();
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            DisplayName = request.DisplayName.Trim(),
            CreatedAtUtc = timeProvider.GetUtcNow(),
            LockoutEnabled = true
        };

        var createResult = await accountRepository.CreateMemberAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            if (IsDuplicateEmail(createResult.Errors))
            {
                return DuplicateEmail();
            }

            return Result<AuthSession>.Invalid("Thông tin đăng ký chưa hợp lệ", MapIdentityErrors(createResult.Errors));
        }

        // A new member is signed in right after registering, with the short refresh token lifetime.
        var shortLifetime = TimeSpan.FromDays(jwtOptions.Value.ShortRefreshTokenDays);
        return await CreateSessionAsync(user, shortLifetime, cancellationToken);
    }

    public async Task<Result<AuthSession>> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await accountRepository.FindByEmailAsync(request.Email.Trim());
        if (user is null)
        {
            return LoginFailed();
        }

        // Khóa quản trị hết hạn không được mang lý do cũ sang lần khóa do nhập sai mật khẩu.
        if (user.LockReason is not null && user.LockoutEnd.HasValue &&
            user.LockoutEnd.Value <= timeProvider.GetUtcNow())
        {
            user.LockReason = null;
            if (!(await accountRepository.UpdateAsync(user)).Succeeded)
            {
                return LoginFailed();
            }
        }

        var signInResult = await accountRepository.CheckPasswordAsync(user, request.Password);

        if (signInResult.IsLockedOut)
        {
            return Locked();
        }

        if (!signInResult.Succeeded)
        {
            return LoginFailed();
        }

        var lifetime = request.RememberMe
            ? TimeSpan.FromDays(jwtOptions.Value.RefreshTokenDays)
            : TimeSpan.FromDays(jwtOptions.Value.ShortRefreshTokenDays);
        return await CreateSessionAsync(user, lifetime, cancellationToken);
    }

    public async Task<Result<AuthSession>> RefreshAsync(string? refreshToken, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return SessionExpired();
        }

        var now = timeProvider.GetUtcNow();
        var storedToken = await refreshTokenRepository.FindByHashAsync(
            tokenService.HashRefreshToken(refreshToken),
            cancellationToken);
        if (storedToken is null)
        {
            return SessionExpired();
        }

        if (storedToken.RevokedAtUtc is not null)
        {
            // An old token is being used again, so it may have been copied.
            // Sign the user out on every device and write it to the log, because it may be an attack.
            logger.LogWarning(
                "Phát hiện refresh token đã thu hồi bị dùng lại; thu hồi mọi phiên của tài khoản {UserId}.",
                storedToken.UserId);
            await refreshTokenRepository.RevokeAllForUserAsync(storedToken.UserId, now, cancellationToken);
            return SessionExpired();
        }

        if (storedToken.ExpiresAtUtc <= now)
        {
            return SessionExpired();
        }

        var user = await accountRepository.FindByIdAsync(storedToken.UserId);
        if (user is null)
        {
            return SessionExpired();
        }

        if (await accountRepository.IsLockedOutAsync(user))
        {
            await refreshTokenRepository.RevokeAllForUserAsync(user.Id, now, cancellationToken);
            return Locked();
        }

        // The new token keeps the same lifetime as the one it replaces.
        var lifetime = storedToken.ExpiresAtUtc - storedToken.CreatedAtUtc;
        var newRefreshToken = tokenService.GenerateRefreshToken();
        var replacement = CreateRefreshTokenRecord(user.Id, newRefreshToken, now, lifetime);
        var wasRotated = await refreshTokenRepository.RotateAsync(
            storedToken.Id,
            replacement,
            now,
            cancellationToken);
        if (!wasRotated)
        {
            return SessionExpired();
        }

        return await BuildSuccessAsync(user, newRefreshToken, replacement.ExpiresAtUtc);
    }

    public async Task<CurrentUserDto?> GetCurrentUserAsync(string userId)
    {
        var user = await accountRepository.FindByIdAsync(userId);
        return user is null ? null : await MapUserAsync(user);
    }

    public async Task<Result<CurrentUserDto>> UpdateProfileAsync(
        string userId,
        UpdateProfileRequest request)
    {
        var displayName = request.DisplayName.Trim();
        if (displayName.Length < 2)
        {
            return Result<CurrentUserDto>.Fail(ErrorType.Validation, ProfileTitle, "Tên hiển thị phải từ 2 đến 80 ký tự.", "displayName");
        }

        var user = await accountRepository.FindByIdAsync(userId);
        if (user is null)
        {
            return Result<CurrentUserDto>.Fail(ErrorType.Unauthorized, NotSignedInTitle);
        }

        user.DisplayName = displayName;
        user.Bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();
        var updateResult = await accountRepository.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return Result<CurrentUserDto>.Invalid(ProfileTitle, MapIdentityErrors(updateResult.Errors));
        }

        return Result<CurrentUserDto>.Success(await MapUserAsync(user));
    }

    public async Task<Result<CurrentUserDto>> ChangePasswordAsync(
        string userId,
        ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        var user = await accountRepository.FindByIdAsync(userId);
        if (user is null)
        {
            return Result<CurrentUserDto>.Fail(ErrorType.Unauthorized, NotSignedInTitle);
        }

        var changeResult = await accountRepository.ChangePasswordAsync(
            user,
            request.CurrentPassword,
            request.NewPassword);
        if (!changeResult.Succeeded)
        {
            return Result<CurrentUserDto>.Invalid("Không thể đổi mật khẩu", MapPasswordChangeErrors(changeResult.Errors));
        }

        // The security stamp changed, so access tokens stop working.
        // Revoking the refresh tokens signs the user out on every device.
        await refreshTokenRepository.RevokeAllForUserAsync(
            user.Id,
            timeProvider.GetUtcNow(),
            cancellationToken);
        return Result<CurrentUserDto>.Success(await MapUserAsync(user));
    }

    public async Task LogoutAsync(string? refreshToken, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return;
        }

        await refreshTokenRepository.RevokeByHashAsync(
            tokenService.HashRefreshToken(refreshToken),
            timeProvider.GetUtcNow(),
            cancellationToken);
    }

    private async Task<Result<AuthSession>> CreateSessionAsync(
        ApplicationUser user,
        TimeSpan refreshTokenLifetime,
        CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        var refreshToken = tokenService.GenerateRefreshToken();
        var record = CreateRefreshTokenRecord(user.Id, refreshToken, now, refreshTokenLifetime);
        await refreshTokenRepository.AddAsync(record, cancellationToken);
        return await BuildSuccessAsync(user, refreshToken, record.ExpiresAtUtc);
    }

    private RefreshToken CreateRefreshTokenRecord(
        string userId,
        string refreshToken,
        DateTimeOffset now,
        TimeSpan lifetime)
    {
        return new()
        {
            UserId = userId,
            TokenHash = tokenService.HashRefreshToken(refreshToken),
            CreatedAtUtc = now,
            ExpiresAtUtc = now.Add(lifetime)
        };
    }

    private async Task<Result<AuthSession>> BuildSuccessAsync(
        ApplicationUser user,
        string refreshToken,
        DateTimeOffset refreshTokenExpiresAtUtc)
    {
        var roles = await accountRepository.GetRolesAsync(user);
        var accessToken = tokenService.CreateAccessToken(user, roles);
        var tokens = new AuthTokens(
            accessToken.Token,
            accessToken.ExpiresAtUtc,
            refreshToken,
            refreshTokenExpiresAtUtc);
        return Result<AuthSession>.Success(new AuthSession(await MapUserAsync(user), tokens));
    }

    private async Task<CurrentUserDto> MapUserAsync(ApplicationUser user)
    {
        var roles = await accountRepository.GetRolesAsync(user);
        return new CurrentUserDto(
            user.Id,
            user.DisplayName,
            user.Bio,
            user.AvatarUrl,
            user.Email ?? string.Empty,
            roles,
            ReputationRules.ForDisplay(user.Reputation));
    }

    private static bool IsDuplicateEmail(IEnumerable<IdentityError> errors)
    {
        return errors.Any(error => error.Code == "DuplicateEmail" || error.Code == "DuplicateUserName");
    }

    private static Result<AuthSession> DuplicateEmail()
    {
        return Result<AuthSession>.Fail(ErrorType.Conflict, "Email đã được sử dụng", "Vui lòng đăng nhập hoặc dùng một email khác.");
    }

    private static Result<AuthSession> LoginFailed()
    {
        return Result<AuthSession>.Fail(ErrorType.Unauthorized, "Đăng nhập không thành công", "Email hoặc mật khẩu không chính xác.");
    }

    private static Result<AuthSession> SessionExpired()
    {
        return Result<AuthSession>.Fail(ErrorType.Unauthorized, "Phiên đăng nhập đã hết hạn", "Vui lòng đăng nhập lại.");
    }

    private static Result<AuthSession> Locked()
    {
        return Result<AuthSession>.Fail(ErrorType.Locked, "Tài khoản đang bị khóa", "Vui lòng liên hệ quản trị viên để được hỗ trợ.");
    }

    private static IReadOnlyDictionary<string, string[]> MapIdentityErrors(
        IEnumerable<IdentityError> errors)
    {
        return errors
            .GroupBy(GetErrorField)
            .ToDictionary(
                group => group.Key,
                group => group.Select(error => TranslateError(error)).ToArray());
    }

    private static IReadOnlyDictionary<string, string[]> MapPasswordChangeErrors(
        IEnumerable<IdentityError> errors)
    {
        return errors
            .GroupBy(error => error.Code == "PasswordMismatch" ? "currentPassword" : "newPassword")
            .ToDictionary(
                group => group.Key,
                group => group.Select(TranslateError).ToArray());
    }

    private static string GetErrorField(IdentityError error)
    {
        return error.Code.StartsWith("Password", StringComparison.Ordinal)
            ? "password"
            : "account";
    }

    private static readonly Dictionary<string, string> IdentityMessages = new()
    {
        ["PasswordTooShort"] = "Mật khẩu chưa đủ độ dài yêu cầu.",
        ["PasswordRequiresNonAlphanumeric"] = "Mật khẩu cần ít nhất một ký tự đặc biệt.",
        ["PasswordRequiresDigit"] = "Mật khẩu cần ít nhất một chữ số.",
        ["PasswordRequiresUpper"] = "Mật khẩu cần ít nhất một chữ hoa.",
        ["PasswordRequiresLower"] = "Mật khẩu cần ít nhất một chữ thường.",
        ["DuplicateEmail"] = "Email này đã được sử dụng.",
        ["DuplicateUserName"] = "Email này đã được sử dụng.",
        ["PasswordMismatch"] = "Mật khẩu hiện tại không chính xác."
    };

    private static string TranslateError(IdentityError error)
    {
        if (IdentityMessages.TryGetValue(error.Code, out var message))
        {
            return message;
        }

        return "Không thể cập nhật tài khoản với thông tin đã cung cấp.";
    }
}
