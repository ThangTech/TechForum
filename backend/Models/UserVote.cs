using TechForum.Api.Enums;

namespace TechForum.Api.Models;

// Khóa chính (thành viên, đích) bảo đảm mỗi người chỉ có một phiếu cho mỗi bài hoặc câu trả lời.
// Đích có thể là bài hoặc câu trả lời nên không có khóa ngoại; service kiểm tra đích tồn tại.
public sealed class UserVote
{
    public required string UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    public VoteTargetType TargetType { get; set; }
    public Guid TargetId { get; set; }
    public int Value { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset? UpdatedAtUtc { get; set; }
}
