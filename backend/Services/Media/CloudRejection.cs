namespace TechForum.Api.Services;

// Câu từ chối của Cloudinary là tiếng Anh và nói về giới hạn của nó, nên các trường hợp hay gặp được đặt tên.
// Thành viên không thấy tên dịch vụ lưu trữ; câu gốc được nơi gọi ghi vào log.
public static class CloudRejection
{
    public static string ToMessage(string cloudMessage)
    {
        if (cloudMessage == CloudModeration.RejectedMessage)
        {
            return "Ảnh có nội dung không phù hợp (khỏa thân, bạo lực, ma túy...) nên không được tải lên.";
        }

        var text = cloudMessage.ToLowerInvariant();

        if (text.Contains("megapixel") || text.Contains("dimension") || text.Contains("resolution"))
        {
            return "Ảnh có độ phân giải quá lớn. Hãy thu nhỏ ảnh rồi tải lại.";
        }

        if (text.Contains("too large") || text.Contains("too big") || text.Contains("exceed") || text.Contains("maximum"))
        {
            return "Tệp vượt quá kích thước cho phép. Hãy chọn tệp nhỏ hơn.";
        }

        if (text.Contains("failed to ping") || text.Contains("invalid") || text.Contains("unsupported") ||
            text.Contains("corrupt") || text.Contains("not a valid"))
        {
            return "Không đọc được tệp này (tệp lỗi hoặc không đúng định dạng).";
        }

        return "Không thể lưu tệp này. Hãy thử một tệp khác.";
    }
}
