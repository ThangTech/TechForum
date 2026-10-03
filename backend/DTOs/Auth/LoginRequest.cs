using System.ComponentModel.DataAnnotations;

namespace TechForum.Api.Dtos.Auth;

public sealed class LoginRequest
{
    [Required(ErrorMessage = "Vui lòng nhập email.")]
    [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập mật khẩu.")]
    public string Password { get; init; } = string.Empty;

    public bool RememberMe { get; init; }
}
