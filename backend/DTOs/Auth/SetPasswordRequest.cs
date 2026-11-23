using System.ComponentModel.DataAnnotations;

namespace TechForum.Api.Dtos.Auth;

// Đặt mật khẩu lần đầu cho tài khoản chưa có (ví dụ tài khoản tạo bằng Google), nên không có mật khẩu hiện tại.
public sealed class SetPasswordRequest
{
    [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới.")]
    [StringLength(128, MinimumLength = 8, ErrorMessage = "Mật khẩu mới phải từ 8 đến 128 ký tự.")]
    public string NewPassword { get; init; } = string.Empty;
}
