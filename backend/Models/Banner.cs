namespace TechForum.Api.Models;

public sealed class Banner
{
    public Guid Id { get; set; }

    // Cũng là văn bản thay thế của ảnh.
    public required string Title { get; set; }

    public required string ImageUrl { get; set; }

    // Một trang của site ("/articles") hoặc địa chỉ http(s) đầy đủ.
    public string? LinkUrl { get; set; }

    public int DisplayOrder { get; set; }

    public bool IsActive { get; set; } = true;

    // Để trống là hiện ngay.
    public DateTimeOffset? StartsAtUtc { get; set; }

    // Để trống là hiện không thời hạn.
    public DateTimeOffset? EndsAtUtc { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }
}
