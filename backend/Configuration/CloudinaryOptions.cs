namespace TechForum.Api.Configuration;

// Ba giá trị lấy ở Cloudinary Dashboard. Đây là bí mật: đặt bằng user-secrets hoặc biến môi trường,
// không ghi vào file được commit.
public sealed class CloudinaryOptions
{
    public const string SectionName = "Cloudinary";

    public string CloudName { get; init; } = string.Empty;
    public string ApiKey { get; init; } = string.Empty;
    public string ApiSecret { get; init; } = string.Empty;

    // Thư mục chứa mọi tệp của site, để một tài khoản dùng được cho nhiều môi trường (techforum, techforum-dev).
    public string Folder { get; init; } = "techforum";

    // Kiểm duyệt ảnh bằng AI khi tải lên, ví dụ "aws_rek"; phải đăng ký add-on trên Cloudinary trước.
    // Để trống thì không kiểm duyệt.
    public string ImageModeration { get; init; } = string.Empty;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(CloudName) &&
        !string.IsNullOrWhiteSpace(ApiKey) &&
        !string.IsNullOrWhiteSpace(ApiSecret);
}
