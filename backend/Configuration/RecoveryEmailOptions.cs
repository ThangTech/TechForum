namespace TechForum.Api.Configuration;

// Cấu hình gửi email (mục "RecoveryEmail", giữ tên cũ để không phải đổi biến môi trường): dùng cho email quên mật khẩu
// và email xác minh tài khoản.
public sealed class RecoveryEmailOptions
{
    public const string SectionName = "RecoveryEmail";
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UseTls { get; set; } = true;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
    public string FrontendUrl { get; set; } = string.Empty;

    // Địa chỉ trang web để ghép link trong email. Lấy từ cấu hình tin cậy, không ghép từ Host header của request.
    // Phải là https, trừ địa chỉ localhost (chỉ chính máy đó mở được nên không ai chặn giữa đường).
    public bool TryGetFrontendUrl(out string frontendUrl)
    {
        frontendUrl = FrontendUrl.TrimEnd('/');
        if (!Uri.TryCreate(frontendUrl, UriKind.Absolute, out var uri))
        {
            return false;
        }
        if (!string.IsNullOrEmpty(uri.UserInfo) || !string.IsNullOrEmpty(uri.Query) ||
            !string.IsNullOrEmpty(uri.Fragment) || uri.AbsolutePath != "/")
        {
            return false;
        }

        return uri.Scheme == Uri.UriSchemeHttps || (uri.Scheme == Uri.UriSchemeHttp && uri.IsLoopback);
    }
}
