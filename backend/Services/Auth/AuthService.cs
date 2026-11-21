using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos.Auth;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class AuthService(
    IAccountRepository accountRepository,
    IRefreshTokenRepository refreshTokenRepository,
    ITokenService tokenService,
    IOptions<JwtOptions> jwtOptions,
    ILogger<AuthService> logger,
    TimeProvider timeProvider) : IAuthService
{
    public async Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim();
        if (await accountRepository.FindByEmailAsync(email) is not null)
        {
            return AuthResult.Failed(AuthFailureKind.DuplicateEmail);
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
            return AuthResult.Failed(
                GetFailureKind(createResult.Errors),
                MapIdentityErrors(createResult.Errors));
        }

        // A new member is signed in right after registering, with the short refresh token lifetime.
        var shortLifetime = TimeSpan.FromDays(jwtOptions.Value.ShortRefreshTokenDays);
        return await CreateSessionAsync(user, shortLifetime, cancellationToken);
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await accountRepository.FindByEmailAsync(request.Email.Trim());
        if (user is null)
        {
            return AuthResult.Failed(AuthFailureKind.InvalidCredentials);
        }

        // Khóa quản trị hết hạn không được mang lý do cũ sang lần khóa do nhập sai mật khẩu.
        if (user.LockReason is not null && user.LockoutEnd.HasValue &&
            user.LockoutEnd.Value <= timeProvider.GetUtcNow())
        {
            user.LockReason = null;
            if (!(await accountRepository.UpdateAsync(user)).Succeeded)
            {
                return AuthResult.Failed(AuthFailureKind.InvalidCredentials);
            }
        }

        var signInResult = await accountRepository.CheckPasswordAsync(user, request.Password);

        if (signInResult.IsLockedOut)
        {
            return AuthResult.Failed(AuthFailureKind.LockedOut);
        }

        if (!signInResult.Succeeded)
        {
            return AuthResult.Failed(AuthFailureKind.InvalidCredentials);
        }

        var lifetime = request.RememberMe
            ? TimeSpan.FromDays(jwtOptions.Value.RefreshTokenDays)
            : TimeSpan.FromDays(jwtOptions.Value.ShortRefreshTokenDays);
        return await CreateSessionAsync(user, lifetime, cancellationToken);
    }

    public async Task<AuthResult> RefreshAsync(string? refreshToken, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return AuthResult.Failed(AuthFailureKind.InvalidRefreshToken);
        }

        var now = timeProvider.GetUtcNow();
        var storedToken = await refreshTokenRepository.FindByHashAsync(
            tokenService.HashRefreshToken(refreshToken),
            cancellationToken);
        if (storedToken is null)
        {
            return AuthResult.Failed(AuthFailureKind.InvalidRefreshToken);
        }

        if (storedToken.RevokedAtUtc is not null)
        {
            // An old token is being used again, so it may have been copied.
            // Sign the user out on every device and write it to the log, because it may be an attack.
            logger.LogWarning(
                "Phát hiện refresh token đã thu hồi bị dùng lại; thu hồi mọi phiên của tài khoản {UserId}.",
                storedToken.UserId);
            await refreshTokenRepository.RevokeAllForUserAsync(storedToken.UserId, now, cancellationToken);
            return AuthResult.Failed(AuthFailureKind.InvalidRefreshToken);
        }

        if (storedToken.ExpiresAtUtc <= now)
        {
            return AuthResult.Failed(AuthFailureKind.InvalidRefreshToken);
        }

        var user = await accountRepository.FindByIdAsync(storedToken.UserId);
        if (user is null)
        {
            return AuthResult.Failed(AuthFailureKind.InvalidRefreshToken);
        }

        if (await accountRepository.IsLockedOutAsync(user))
        {
            await refreshTokenRepository.RevokeAllForUserAsync(user.Id, now, cancellationToken);
            return AuthResult.Failed(AuthFailureKind.LockedOut);
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
            return AuthResult.Failed(AuthFailureKind.InvalidRefreshToken);
        }

        return await BuildSuccessAsync(user, newRefreshToken, replacement.ExpiresAtUtc);
    }

    public async Task<CurrentUserDto?> GetCurrentUserAsync(string userId)
    {
        var user = await accountRepository.FindByIdAsync(userId);
        return user is null ? null : await MapUserAsync(user);
    }

    public async Task<AuthResult> UpdateProfileAsync(
        string userId,
        UpdateProfileRequest request)
    {
        var displayName = request.DisplayName.Trim();
        if (displayName.Length < 2)
        {
            return AuthResult.Failed(
                AuthFailureKind.Validation,
                new Dictionary<string, string[]>
                {
                    ["displayName"] = ["Tên hiển thị phải từ 2 đến 80 ký tự."]
                });
        }

        var user = await accountRepository.FindByIdAsync(userId);
        if (user is null)
        {
            return AuthResult.Failed(AuthFailureKind.InvalidCredentials);
        }

        user.DisplayName = displayName;
        user.Bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();
        var updateResult = await accountRepository.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return AuthResult.Failed(
                AuthFailureKind.Validation,
                MapIdentityErrors(updateResult.Errors));
        }

        return AuthResult.Success(await MapUserAsync(user));
    }

    public async Task<AuthResult> ChangePasswordAsync(
        string userId,
        ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        var user = await accountRepository.FindByIdAsync(userId);
        if (user is null)
        {
            return AuthResult.Failed(AuthFailureKind.InvalidCredentials);
        }

        var changeResult = await accountRepository.ChangePasswordAsync(
            user,
            request.CurrentPassword,
            request.NewPassword);
        if (!changeResult.Succeeded)
        {
            return AuthResult.Failed(
                AuthFailureKind.Validation,
                MapPasswordChangeErrors(changeResult.Errors));
        }

        // The security stamp changed, so access tokens stop working.
        // Revoking the refresh tokens signs the user out on every device.
        await refreshTokenRepository.RevokeAllForUserAsync(
            user.Id,
            timeProvider.GetUtcNow(),
            cancellationToken);
        return AuthResult.Success(await MapUserAsync(user));
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

    private async Task<AuthResult> CreateSessionAsync(
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
        TimeSpan lifetime) => new()
    {
        UserId = userId,
        TokenHash = tokenService.HashRefreshToken(refreshToken),
        CreatedAtUtc = now,
        ExpiresAtUtc = now.Add(lifetime)
    };

    private async Task<AuthResult> BuildSuccessAsync(
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
        return AuthResult.Success(await MapUserAsync(user), tokens);
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

    private static AuthFailureKind GetFailureKind(IEnumerable<IdentityError> errors)
    {
        return errors.Any(error =>
            error.Code is "DuplicateEmail" or "DuplicateUserName")
            ? AuthFailureKind.DuplicateEmail
            : AuthFailureKind.Validation;
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

    private static string GetErrorField(IdentityError error) =>
        error.Code.StartsWith("Password", StringComparison.Ordinal)
            ? "password"
            : "account";

    private static string TranslateError(IdentityError error) => error.Code switch
    {
        "PasswordTooShort" => "Mật khẩu chưa đủ độ dài yêu cầu.",
        "PasswordRequiresNonAlphanumeric" => "Mật khẩu cần ít nhất một ký tự đặc biệt.",
        "PasswordRequiresDigit" => "Mật khẩu cần ít nhất một chữ số.",
        "PasswordRequiresUpper" => "Mật khẩu cần ít nhất một chữ hoa.",
        "PasswordRequiresLower" => "Mật khẩu cần ít nhất một chữ thường.",
        "DuplicateEmail" or "DuplicateUserName" => "Email này đã được sử dụng.",
        "PasswordMismatch" => "Mật khẩu hiện tại không chính xác.",
        _ => "Không thể cập nhật tài khoản với thông tin đã cung cấp."
    };
}
