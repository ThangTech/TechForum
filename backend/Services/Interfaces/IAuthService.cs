using TechForum.Api.Dtos.Auth;

namespace TechForum.Api.Services;

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(RegisterRequest request);

    Task<AuthResult> LoginAsync(LoginRequest request);

    Task<CurrentUserDto?> GetCurrentUserAsync(string userId);

    Task<AuthResult> UpdateProfileAsync(string userId, UpdateProfileRequest request);

    Task<AuthResult> ChangePasswordAsync(string userId, ChangePasswordRequest request);

    Task LogoutAsync();
}
