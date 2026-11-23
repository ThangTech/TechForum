using System.ComponentModel.DataAnnotations;
using TechForum.Api.Enums;

namespace TechForum.Api.Dtos;

public sealed class TopicQuery : PageQuery, IValidatableObject
{
    public TopicQuery()
    {
        PageSize = 10;
    }

    [StringLength(100, ErrorMessage = "Từ khóa không được vượt quá 100 ký tự.")]
    public string? Keyword { get; init; }

    [EnumDataType(typeof(TopicType), ErrorMessage = "Loại nội dung không hợp lệ.")]
    public TopicType? Type { get; init; }

    public Guid? CategoryId { get; init; }
    public Guid? TagId { get; init; }

    [RegularExpression("(?i)^(discussion|weekly|hot|top)$", ErrorMessage = "Kiểu sắp xếp chỉ hỗ trợ 'discussion', 'weekly', 'hot' hoặc 'top'.")]
    public string? Sort { get; init; }

    // Với sort=top: bài trong ngày, tuần, tháng hoặc mọi lúc (mặc định).
    [RegularExpression("(?i)^(day|week|month|all)$", ErrorMessage = "Khoảng thời gian chỉ hỗ trợ 'day', 'week', 'month' hoặc 'all'.")]
    public string? Range { get; init; }

    [RegularExpression("^(unanswered|unsolved|solved)$", ErrorMessage = "Trạng thái câu hỏi không hợp lệ.")]
    public string? QuestionStatus { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (CategoryId == Guid.Empty)
        {
            yield return new ValidationResult("Mã chuyên mục không hợp lệ.", ["categoryId"]);
        }

        if (TagId == Guid.Empty)
        {
            yield return new ValidationResult("Mã thẻ không hợp lệ.", ["tagId"]);
        }

        if (QuestionStatus is not null && Type == TopicType.Article)
        {
            yield return new ValidationResult("Bộ lọc trạng thái chỉ dùng cho câu hỏi.", ["questionStatus"]);
        }
    }
}
