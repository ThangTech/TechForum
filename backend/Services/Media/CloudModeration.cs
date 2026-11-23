using CloudinaryDotNet.Actions;

namespace TechForum.Api.Services;

// Kiểm duyệt ảnh bằng add-on Amazon Rekognition AI Moderation (Cloudinary:ImageModeration).
// Kết quả có ngay trong câu trả lời của lần tải lên nên thành viên biết luôn.
public static class CloudModeration
{
    public const string RejectedMessage = "Image rejected by moderation";

    public static bool IsRejected(IEnumerable<Moderation>? results)
    {
        return results?.Any(result => result.Status == ModerationStatus.Rejected) == true;
    }

    // Lỗi đến từ add-on chứ không phải từ tệp: chưa đăng ký hoặc hết hạn mức miễn phí của tháng.
    public static bool IsUnavailable(string? errorMessage)
    {
        var text = errorMessage?.ToLowerInvariant() ?? string.Empty;
        return text.Contains("moderation") || text.Contains("add-on") || text.Contains("addon") ||
            text.Contains("aws_rek") || text.Contains("subscription") || text.Contains("quota");
    }
}
