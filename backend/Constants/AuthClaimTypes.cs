namespace TechForum.Api.Constants;

public static class AuthClaimTypes
{
    // Bản sao security stamp của tài khoản. Nó đổi khi đổi mật khẩu, nên token cấp trước đó hết hiệu lực.
    public const string SecurityStamp = "stamp";
}
