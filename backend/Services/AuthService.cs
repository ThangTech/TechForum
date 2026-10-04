using Microsoft.AspNetCore.Identity;
using TechForum.Api.Data.Repositories;
using TechForum.Api.Dtos.Auth;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Services;

public sealed class AuthService(
    IAccountRepository accountRepository,
    TimeProvider timeProvider) : IAuthService
{
    public async Task<AuthResult> RegisterAsync(RegisterRequest request)
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

        await accountRepository.SignInAsync(user);
        return AuthResult.Success(await MapUserAsync(user));
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request)
    {
        var user = await accountRepository.FindByEmailAsync(request.Email.Trim());
        if (user is null)
        {
            return AuthResult.Failed(AuthFailureKind.InvalidCredentials);
        }

        var signInResult = await accountRepository.PasswordSignInAsync(
            user,
            request.Password,
            request.RememberMe);

        if (signInResult.IsLockedOut)
        {
            return AuthResult.Failed(AuthFailureKind.LockedOut);
        }

        if (!signInResult.Succeeded)
        {
            return AuthResult.Failed(AuthFailureKind.InvalidCredentials);
        }

        return AuthResult.Success(await MapUserAsync(user));
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
        var updateResult = await accountRepository.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return AuthResult.Failed(
                AuthFailureKind.Validation,
                MapIdentityErrors(updateResult.Errors));
        }

        await accountRepository.RefreshSignInAsync(user);
        return AuthResult.Success(await MapUserAsync(user));
    }

    public async Task<AuthResult> ChangePasswordAsync(
        string userId,
        ChangePasswordRequest request)
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

        await accountRepository.RefreshSignInAsync(user);
        return AuthResult.Success(await MapUserAsync(user));
    }

    public Task LogoutAsync() => accountRepository.SignOutAsync();

    private async Task<CurrentUserDto> MapUserAsync(ApplicationUser user)
    {
        var roles = await accountRepository.GetRolesAsync(user);
        return new CurrentUserDto(
            user.Id,
            user.DisplayName,
            user.Email ?? string.Empty,
            roles);
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
