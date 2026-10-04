using System.ComponentModel.DataAnnotations;

namespace TechForum.Api.Dtos.Auth;

public sealed class UpdateProfileRequest
{
    [Required(ErrorMessage = "Vui lòng nhập tên hiển thị.")]
    [StringLength(80, MinimumLength = 2, ErrorMessage = "Tên hiển thị phải từ 2 đến 80 ký tự.")]
    public string DisplayName { get; init; } = string.Empty;
}
