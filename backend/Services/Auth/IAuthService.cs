using TechForum.Api.Dtos.Auth;

namespace TechForum.Api.Services;

public interface IAuthService
{
    Task<Result<AuthSession>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);

    Task<Result<AuthSession>> LoginAsync(LoginRequest request, CancellationToken cancellationToken);

    // Exchanges a valid refresh token for a new access token and a new refresh token.
    Task<Result<AuthSession>> RefreshAsync(string? refreshToken, CancellationToken cancellationToken);

    Task<CurrentUserDto?> GetCurrentUserAsync(string userId);

    Task<Result<CurrentUserDto>> UpdateProfileAsync(string userId, UpdateProfileRequest request);

    // Changing the password signs the user out on every device.
    Task<Result<CurrentUserDto>> ChangePasswordAsync(
        string userId,
        ChangePasswordRequest request,
        CancellationToken cancellationToken);

    Task LogoutAsync(string? refreshToken, CancellationToken cancellationToken);
}
