namespace TechForum.Api.Services;

// Turns the sentence that Cloudinary gives when it refuses a file into a sentence for the member. The text of Cloudinary
// is in English and talks about its own limits, so the common cases are named and the others keep the original sentence.
// The sentences were seen on a real account: "File size too large. Got ... Maximum is ..." for a file over the limit
// of the plan, and "Failed to ping image" for a file that is not a picture.
public static class CloudRejection
{
    public static string ToMessage(string cloudMessage)
    {
        var text = cloudMessage.ToLowerInvariant();

        if (text.Contains("megapixel") || text.Contains("dimension") || text.Contains("resolution"))
        {
            return "Ảnh có độ phân giải quá lớn so với giới hạn của Cloudinary. Hãy thu nhỏ ảnh rồi tải lại.";
        }

        if (text.Contains("too large") || text.Contains("too big") || text.Contains("exceed") || text.Contains("maximum"))
        {
            return "Tệp vượt quá kích thước mà Cloudinary cho phép. Hãy chọn tệp nhỏ hơn.";
        }

        if (text.Contains("failed to ping") || text.Contains("invalid") || text.Contains("unsupported") ||
            text.Contains("corrupt") || text.Contains("not a valid"))
        {
            return "Cloudinary không đọc được tệp này (tệp lỗi hoặc không đúng định dạng).";
        }

        return $"Cloudinary từ chối tệp: {cloudMessage}";
    }
}
