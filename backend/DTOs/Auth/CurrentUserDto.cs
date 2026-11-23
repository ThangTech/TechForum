namespace TechForum.Api.Dtos.Auth;

public sealed record CurrentUserDto(
    string Id,
    string DisplayName,
    string? Bio,
    string? AvatarUrl,
    string Email,
    IReadOnlyList<string> Roles,
    int Reputation = 0,
    // False với tài khoản chỉ đăng nhập bằng Google: trang cá nhân cho đặt mật khẩu thay vì đổi mật khẩu.
    bool HasPassword = true,
    bool IsGoogleLinked = false);
