using System.ComponentModel.DataAnnotations;

namespace TechForum.Api.Dtos.Auth;

public sealed class ChangePasswordRequest
{
    [Required(ErrorMessage = "Vui lòng nhập mật khẩu hiện tại.")]
    public string CurrentPassword { get; init; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới.")]
    [StringLength(128, MinimumLength = 8, ErrorMessage = "Mật khẩu mới phải từ 8 đến 128 ký tự.")]
    public string NewPassword { get; init; } = string.Empty;
}
