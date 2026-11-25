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
    DateTimeOffset? LockoutEndUtc,
    bool EmailConfirmed,
    // Bài và câu trả lời chưa xoá, và số báo cáo về nội dung của người này đã được chấp nhận (số lần vi phạm).
    int TopicCount,
    int AnswerCount,
    int ViolationCount);

public sealed record SetAccountLockRequest(bool IsLocked, string? Reason = null, DateTimeOffset? LockoutEndUtc = null);

public sealed record SetAccountRoleRequest(bool IsAdministrator, string? Reason = null);

public sealed class AdminAccountQuery : PageQuery
{
    [StringLength(100, ErrorMessage = "Từ khóa không được vượt quá 100 ký tự.")]
    public string? Keyword { get; init; }

    [RegularExpression("(?i)^(locked|unlocked|unverified)?$", ErrorMessage = "Trạng thái phải là locked, unlocked hoặc unverified.")]
    public string? Status { get; init; }

    [RegularExpression("(?i)^(administrator|member)?$", ErrorMessage = "Vai trò phải là administrator hoặc member.")]
    public string? Role { get; init; }
}
