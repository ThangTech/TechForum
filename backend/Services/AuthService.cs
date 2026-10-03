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
        _ => "Không thể tạo tài khoản với thông tin đã cung cấp."
    };
}
