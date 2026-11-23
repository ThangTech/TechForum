using TechForum.Api.Enums;

namespace TechForum.Api.Models;

// Tự lưu trong lúc viết để mất mạng hay tải lại trang không mất bài. Mỗi thành viên có một bản nháp cho bài mới
// (TopicId null) và một bản cho mỗi bài đang sửa. Không kiểm tra chặt như bài viết vì bản nháp được phép chưa xong.
public sealed class Draft
{
    public Guid Id { get; set; }
    public required string UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    public Guid? TopicId { get; set; }
    public Topic? Topic { get; set; }
    public required string Title { get; set; }
    public required string Summary { get; set; }
    public required string BodyHtml { get; set; }
    public TopicType Type { get; set; }
    public Guid? CategoryId { get; set; }
    public List<Guid> TagIds { get; set; } = [];
    // Việc dọn tệp không dùng giữ lại các tệp này khi bản nháp còn tồn tại.
    public List<Guid> MediaIds { get; set; } = [];
    public DateTimeOffset UpdatedAtUtc { get; set; }
}
