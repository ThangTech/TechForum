using System.ComponentModel.DataAnnotations;

namespace TechForum.Api.Dtos.Auth;

public sealed class RegisterRequest
{
    [Required(ErrorMessage = "Vui lòng nhập tên hiển thị.")]
    [StringLength(80, MinimumLength = 2, ErrorMessage = "Tên hiển thị phải từ 2 đến 80 ký tự.")]
    public string DisplayName { get; init; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập email.")]
    [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
    [StringLength(256, ErrorMessage = "Email không được vượt quá 256 ký tự.")]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập mật khẩu.")]
    [StringLength(128, MinimumLength = 8, ErrorMessage = "Mật khẩu phải từ 8 đến 128 ký tự.")]
    public string Password { get; init; } = string.Empty;
}
