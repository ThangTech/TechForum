using System.ComponentModel.DataAnnotations;

namespace TechForum.Api.Dtos.Auth;

public sealed class ForgotPasswordRequest
{
    [Required, EmailAddress, MaxLength(254)]
    public string Email { get; init; } = string.Empty;
}

public sealed class ResetPasswordRequest
{
    [Required, EmailAddress, MaxLength(254)]
    public string Email { get; init; } = string.Empty;

    [Required, MaxLength(4096)]
    public string Token { get; init; } = string.Empty;

    [Required, MinLength(8), MaxLength(100)]
    public string NewPassword { get; init; } = string.Empty;
}
