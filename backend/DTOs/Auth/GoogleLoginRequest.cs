using System.ComponentModel.DataAnnotations;

namespace TechForum.Api.Dtos.Auth;

// Credential: ID token mà nút "Đăng nhập bằng Google" trả về cho trình duyệt.
public sealed class GoogleLoginRequest
{
    [Required(ErrorMessage = "Thiếu thông tin đăng nhập Google.")]
    public string Credential { get; init; } = string.Empty;
}
