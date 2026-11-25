using TechForum.Api.Enums;

namespace TechForum.Api.Models;

public sealed class Topic
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public required string Slug { get; set; }
    public required string Summary { get; set; }
    public required string BodyHtml { get; set; }
    // Tiêu đề, tóm tắt và nội dung đã bỏ dấu, viết thường (TopicSearchText) để tìm kiếm không dấu.
    public string SearchText { get; set; } = string.Empty;
    // Ảnh đầu tiên trong nội dung, dùng làm ảnh bìa ở danh sách.
    public string? CoverImageUrl { get; set; }
    public TopicType Type { get; set; }
    public TopicStatus Status { get; set; }
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public required string AuthorId { get; set; }
    public ApplicationUser Author { get; set; } = null!;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset? UpdatedAtUtc { get; set; }
    public DateTimeOffset? PublishedAtUtc { get; set; }
    public bool IsDeleted { get; set; }
    public bool IsHiddenByModerator { get; set; }
    // Có giá trị khi tự ẩn vì nhiều báo cáo. Từ chối hết báo cáo thì hiện lại; quyết định của quản trị viên thì xóa giá trị này.
    public DateTimeOffset? AutoHiddenAtUtc { get; set; }
    public bool IsDiscussionLocked { get; set; }
    public bool IsPinned { get; set; }
    public int ViewCount { get; set; }
    public int ShareCount { get; set; }
    // Tổng phiếu, cập nhật cùng một giao dịch với bảng phiếu.
    public int Score { get; set; }
    public Guid? AcceptedAnswerId { get; set; }
    public Answer? AcceptedAnswer { get; set; }
    public ICollection<TopicTag> TopicTags { get; set; } = [];
    public ICollection<MediaAsset> MediaAssets { get; set; } = [];
    public ICollection<Answer> Answers { get; set; } = [];
    public ICollection<TopicStar> Stars { get; set; } = [];
    public ICollection<TopicBookmark> Bookmarks { get; set; } = [];
    public ICollection<TopicView> Views { get; set; } = [];
}
