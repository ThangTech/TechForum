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
    int HelpfulCount = 0,
    bool IsHelpful = false,
    // The vote score of the answer and the vote of the member who asks (1, -1 or 0).
    int Score = 0,
    int MyVote = 0,
    // True while the answer is new: the score is hidden (0) for the first hours.
    bool ScoreHidden = false);

public sealed record AnswerHelpfulDto(int HelpfulCount, bool IsHelpful);

public sealed record CreateAnswerRequest([property: FilterProfanity(IsHtml = true)] string? BodyHtml, Guid? ParentAnswerId = null);

public sealed class AnswerQuery : PageQuery, IValidatableObject
{
    public Guid? AroundAnswerId { get; init; }

    [RegularExpression("^(oldest|helpful|score)$", ErrorMessage = "Cách sắp xếp phải là oldest, helpful hoặc score.")]
    public string Sort { get; init; } = "oldest";

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (AroundAnswerId == Guid.Empty)
        {
            yield return new ValidationResult("Mã câu trả lời không hợp lệ.", ["aroundAnswerId"]);
        }
    }
}
