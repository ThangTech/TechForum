namespace TechForum.Api.Models;

public sealed class Answer
{
    public Guid Id { get; set; }
    public Guid TopicId { get; set; }
    public Topic Topic { get; set; } = null!;
    public Guid? ParentAnswerId { get; set; }
    public Answer? ParentAnswer { get; set; }
    public required string AuthorId { get; set; }
    public ApplicationUser Author { get; set; } = null!;
    public required string BodyHtml { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset? UpdatedAtUtc { get; set; }
    public bool IsDeleted { get; set; }
    public bool IsHiddenByModerator { get; set; }
    // Có giá trị khi tự ẩn vì nhiều báo cáo. Từ chối hết báo cáo thì hiện lại; quyết định của quản trị viên thì xóa giá trị này.
    public DateTimeOffset? AutoHiddenAtUtc { get; set; }
    // Tổng phiếu, cập nhật cùng một giao dịch với bảng phiếu.
    public int Score { get; set; }
}
