namespace TechForum.Api.Configuration;

// Giới hạn tốc độ đăng bài để script không làm ngập diễn đàn. Chỉ đếm nội dung đã hợp lệ:
// thành viên sửa lỗi trong form không bị bắt chờ.
public sealed class PostingLimitOptions
{
    public const string SectionName = "PostingLimits";

    public int TopicIntervalSeconds { get; init; } = 30;

    // Cao hơn bài viết vì thảo luận cần qua lại nhanh.
    public int AnswersPerMinute { get; init; } = 5;
}
