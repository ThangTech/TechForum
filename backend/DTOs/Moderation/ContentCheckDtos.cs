using System.ComponentModel.DataAnnotations;

namespace TechForum.Api.Dtos;

// The text that a member is writing. Any of the three may be left out. The limits are a little above the real limits of a
// post and an answer: this request only asks "would the filter change this?" and must not be a way to send huge texts.
public sealed class CheckContentRequest
{
    [StringLength(300, ErrorMessage = "Tiêu đề quá dài.")]
    public string? Title { get; init; }

    [StringLength(1000, ErrorMessage = "Tóm tắt quá dài.")]
    public string? Summary { get; init; }

    [StringLength(100_000, ErrorMessage = "Nội dung quá dài.")]
    public string? BodyHtml { get; init; }
}

// What the filter would do to the text. A cleaned text is only given when it differs from what was sent, so the answer
// stays small; null means "no change".
public sealed record ContentCheckResultDto(
    bool HasProfanity,
    string? Title,
    string? Summary,
    string? BodyHtml);
