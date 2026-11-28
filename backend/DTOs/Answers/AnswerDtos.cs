using System.ComponentModel.DataAnnotations;
using TechForum.Api.Filters;

namespace TechForum.Api.Dtos;

public sealed record AnswerDto(
    Guid Id,
    Guid TopicId,
    Guid? ParentAnswerId,
    TopicAuthorDto? ReplyingTo,
    string BodyHtml,
    TopicAuthorDto Author,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc,
    bool IsAccepted,
    int Score = 0,
    int MyVote = 0,
    // Điểm của câu trả lời mới bị ẩn (bằng 0) trong vài giờ đầu.
    bool ScoreHidden = false);

public sealed record CreateAnswerRequest([property: FilterProfanity(IsHtml = true)] string? BodyHtml, Guid? ParentAnswerId = null);

public sealed class AnswerQuery : PageQuery, IValidatableObject
{
    public Guid? AroundAnswerId { get; init; }

    [RegularExpression("^(oldest|score)$", ErrorMessage = "Cách sắp xếp phải là oldest hoặc score.")]
    public string Sort { get; init; } = "oldest";

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (AroundAnswerId == Guid.Empty)
        {
            yield return new ValidationResult("Mã câu trả lời không hợp lệ.", ["aroundAnswerId"]);
        }
    }
}
