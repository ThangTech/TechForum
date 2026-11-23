using System.ComponentModel.DataAnnotations;

namespace TechForum.Api.Dtos;

// Giới hạn cao hơn một chút so với bài viết thật: yêu cầu này chỉ hỏi "bộ lọc có đổi gì không",
// không được thành cách gửi văn bản rất lớn.
public sealed class CheckContentRequest
{
    [StringLength(300, ErrorMessage = "Tiêu đề quá dài.")]
    public string? Title { get; init; }

    [StringLength(1000, ErrorMessage = "Tóm tắt quá dài.")]
    public string? Summary { get; init; }

    [StringLength(100_000, ErrorMessage = "Nội dung quá dài.")]
    public string? BodyHtml { get; init; }
}

// Chỉ trả văn bản đã làm sạch khi nó khác bản gửi lên, để câu trả lời nhỏ; null là không thay đổi.
public sealed record ContentCheckResultDto(
    bool HasProfanity,
    string? Title,
    string? Summary,
    string? BodyHtml);
