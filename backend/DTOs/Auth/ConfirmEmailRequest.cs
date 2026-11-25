using System.ComponentModel.DataAnnotations;

namespace TechForum.Api.Dtos.Auth;

// UserId và Token lấy từ link trong email xác minh.
public sealed class ConfirmEmailRequest
{
    [Required(ErrorMessage = "Link xác minh không hợp lệ.")]
    public string UserId { get; init; } = string.Empty;

    [Required(ErrorMessage = "Link xác minh không hợp lệ.")]
    public string Token { get; init; } = string.Empty;
}
