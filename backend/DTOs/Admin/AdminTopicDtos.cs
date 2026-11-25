using System.ComponentModel.DataAnnotations;
namespace TechForum.Api.Dtos;

public sealed record AdminTopicDto(
    Guid Id,
    string Title,
    string Type,
    TopicCategoryDto Category,
    TopicAuthorDto Author,
    string Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? PublishedAtUtc,
    bool IsDeleted,
    bool IsHiddenByModerator,
    bool IsDiscussionLocked,
    bool IsPinned,
    // Tự ẩn vì nhiều báo cáo, đang chờ quản trị viên xem; và số báo cáo đang chờ về bài này.
    bool IsAutoHidden,
    int PendingReportCount);

public sealed record AdminTopicDetailDto(AdminTopicDto Topic, string BodyHtml);

public sealed class AdminTopicQuery : PageQuery, IValidatableObject
{
    [StringLength(100, ErrorMessage = "Từ khóa không được vượt quá 100 ký tự.")]
    public string? Keyword { get; init; }

    [RegularExpression("(?i)^(article|question)?$", ErrorMessage = "Loại nội dung phải là article hoặc question.")]
    public string? Type { get; init; }

    public Guid? CategoryId { get; init; }

    [RegularExpression("(?i)^(visible|draft|hidden|deleted|reported|autohidden)?$", ErrorMessage = "Trạng thái hiển thị không hợp lệ.")]
    public string? Visibility { get; init; }

    [RegularExpression("(?i)^(newest|reports)?$", ErrorMessage = "Cách sắp xếp không hợp lệ.")]
    public string? Sort { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (CategoryId == Guid.Empty)
        {
            yield return new ValidationResult("Mã chuyên mục không hợp lệ.", ["categoryId"]);
        }
    }
}

public sealed record ModerateTopicRequest(
    string? Action,
    Guid? CategoryId,
    string? Reason);
