using System.ComponentModel.DataAnnotations;
namespace TechForum.Api.Dtos;

public sealed record AdminAccountDto(
    string Id,
    string DisplayName,
    string Email,
    DateTimeOffset CreatedAtUtc,
    bool IsLocked,
    bool IsAdministrator,
    string? LockReason,
    DateTimeOffset? LockoutEndUtc);

public sealed record SetAccountLockRequest(bool IsLocked, string? Reason = null, DateTimeOffset? LockoutEndUtc = null);

public sealed class AdminAccountQuery : PageQuery
{
    [StringLength(100, ErrorMessage = "Từ khóa không được vượt quá 100 ký tự.")]
    public string? Keyword { get; init; }

    [RegularExpression("(?i)^(locked|unlocked)?$", ErrorMessage = "Trạng thái phải là locked hoặc unlocked.")]
    public string? Status { get; init; }

    [RegularExpression("(?i)^(administrator|member)?$", ErrorMessage = "Vai trò phải là administrator hoặc member.")]
    public string? Role { get; init; }
}
