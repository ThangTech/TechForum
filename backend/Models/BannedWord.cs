namespace TechForum.Api.Models;

// Lưu chữ thường. Bộ lọc bỏ qua hoa thường nhưng giữ dấu, để "các" không bị nhầm với từ không dấu.
public sealed class BannedWord
{
    public Guid Id { get; set; }
    public required string Word { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
}
