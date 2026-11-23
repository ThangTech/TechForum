namespace TechForum.Api.Configuration;

// Đăng nhập bằng Google (mục "GoogleAuth"). ClientId lấy ở Google Cloud Console → APIs & Services → Credentials,
// loại "OAuth client ID" cho ứng dụng web. Client ID không phải bí mật (nó nằm trong JavaScript của trang).
public sealed class GoogleAuthOptions
{
    public const string SectionName = "GoogleAuth";

    public string ClientId { get; init; } = string.Empty;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ClientId);
}
