using TechForum.Api.Dtos.Auth;

namespace TechForum.Api.Services;

public interface IAuthService
{
    Task<Result<AuthSession>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);

    Task<Result<AuthSession>> LoginAsync(LoginRequest request, CancellationToken cancellationToken);

    // Đăng nhập, hoặc tạo tài khoản lần đầu, bằng ID token của Google.
    Task<Result<AuthSession>> LoginWithGoogleAsync(string credential, CancellationToken cancellationToken);

    Task<Result<AuthSession>> RefreshAsync(string? refreshToken, CancellationToken cancellationToken);

    Task<CurrentUserDto?> GetCurrentUserAsync(string userId);

    Task<Result<CurrentUserDto>> UpdateProfileAsync(string userId, UpdateProfileRequest request);

    // Đổi mật khẩu sẽ đăng xuất mọi thiết bị.
    // Đặt mật khẩu cho tài khoản chưa có (tài khoản Google); cũng đăng xuất mọi thiết bị.
    Task<Result<CurrentUserDto>> SetPasswordAsync(string userId, SetPasswordRequest request, CancellationToken cancellationToken);

    Task<Result<CurrentUserDto>> ChangePasswordAsync(
        string userId,
        ChangePasswordRequest request,
        CancellationToken cancellationToken);

    Task LogoutAsync(string? refreshToken, CancellationToken cancellationToken);
}
