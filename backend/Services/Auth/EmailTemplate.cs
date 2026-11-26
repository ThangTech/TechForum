namespace TechForum.Api.Services;

// Mẫu email HTML: logo chữ, lời chào, một nút bấm lớn và link dự phòng. Bảng + CSS viết thẳng trong thẻ vì Gmail,
// Outlook bỏ <style> và không hỗ trợ flex/grid. Bản chữ thường vẫn gửi kèm cho ứng dụng mail không hiện HTML.
public static class EmailTemplate
{
    private const string Primary = "#1463d6";

    public static string Action(string greetingName, string intro, string buttonText, string link, string note, string? supportEmail)
    {
        var support = string.IsNullOrWhiteSpace(supportEmail)
            ? "Đây là email tự động từ TechForum."
            : $"Cần hỗ trợ? Trả lời email này hoặc viết tới <a href=\"mailto:{Encode(supportEmail)}\" style=\"color:{Primary}\">{Encode(supportEmail)}</a>.";
        return $$"""
<!doctype html>
<html lang="vi">
<body style="margin:0;padding:0;background:#f3f5f9;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f9;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px">
<tr><td style="padding:24px 28px 8px;font-size:22px;font-weight:800"><span style="color:#111827">Tech</span><span style="color:{{Primary}}">Forum</span></td></tr>
<tr><td style="padding:8px 28px 4px;font-size:15px;line-height:1.6">
<p style="margin:0 0 12px">Chào {{Encode(greetingName)}},</p>
<p style="margin:0 0 12px">{{Encode(intro)}}</p>
<p style="margin:28px 0;text-align:center"><a href="{{Encode(link)}}" style="display:inline-block;padding:12px 26px;border-radius:8px;background:{{Primary}};color:#ffffff;font-weight:700;text-decoration:none">{{Encode(buttonText)}}</a></p>
<p style="margin:0 0 12px;font-size:13px;color:#6b7280">Nút không bấm được? Mở liên kết sau:<br><a href="{{Encode(link)}}" style="color:{{Primary}};word-break:break-all">{{Encode(link)}}</a></p>
<p style="margin:0 0 12px;font-size:13px;color:#6b7280">{{Encode(note)}}</p>
</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid #f0f2f5;font-size:12px;color:#9ca3af">{{support}}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
""";
    }

    private static string Encode(string value)
    {
        return value.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;");
    }
}
