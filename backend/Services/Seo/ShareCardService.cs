using System.Text;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;

namespace TechForum.Api.Services;

// Khi ai đó dán link bài lên Facebook, Zalo, Messenger..., bot của họ đọc trang này để hiện tiêu đề, tóm tắt và ảnh bìa.
// Người dùng thật không bao giờ thấy trang này: Vercel chỉ chuyển các bot mạng xã hội tới đây (xem frontend/vercel.json).
public sealed class ShareCardService : IShareCardService
{
    private const string SiteName = "TechForum";
    private const string SiteDescription = "Cộng đồng công nghệ Việt: nơi kiến thức được sẻ chia, câu hỏi được trả lời và mọi người cùng học hỏi.";

    private readonly ITopicRepository topicRepository;
    private readonly RecoveryEmailOptions siteOptions;

    public ShareCardService(ITopicRepository topicRepository, IOptions<RecoveryEmailOptions> siteOptions)
    {
        this.topicRepository = topicRepository;
        this.siteOptions = siteOptions.Value;
    }

    public async Task<ShareCard> GetTopicCardAsync(Guid topicId, CancellationToken cancellationToken)
    {
        siteOptions.TryGetFrontendUrl(out var siteUrl);
        var topic = await topicRepository.GetPublicByIdAsync(topicId, cancellationToken);
        if (topic is null)
        {
            return new ShareCard(false, BuildHtml($"Không tìm thấy nội dung · {SiteName}", SiteDescription, siteUrl, null, "website"));
        }

        var url = $"{siteUrl}/topics/{topic.Id}";
        var image = ToAbsoluteUrl(topic.CoverImageUrl, siteUrl);
        return new ShareCard(true, BuildHtml($"{topic.Title} · {SiteName}", topic.Summary, url, image, "article"));
    }

    // Ảnh cũ lưu dạng /media/... được Vercel chuyển sang API, nên ghép với địa chỉ trang web.
    private static string? ToAbsoluteUrl(string? imageUrl, string siteUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
        {
            return null;
        }
        return imageUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ? imageUrl : $"{siteUrl}{imageUrl}";
    }

    private static string BuildHtml(string title, string description, string url, string? image, string type)
    {
        var html = new StringBuilder();
        html.Append("<!doctype html><html lang=\"vi\"><head><meta charset=\"utf-8\">");
        html.Append($"<title>{Encode(title)}</title>");
        html.Append($"<meta name=\"description\" content=\"{Encode(description)}\">");
        html.Append($"<link rel=\"canonical\" href=\"{Encode(url)}\">");
        html.Append($"<meta property=\"og:site_name\" content=\"{SiteName}\">");
        html.Append("<meta property=\"og:locale\" content=\"vi_VN\">");
        html.Append($"<meta property=\"og:type\" content=\"{type}\">");
        html.Append($"<meta property=\"og:title\" content=\"{Encode(title)}\">");
        html.Append($"<meta property=\"og:description\" content=\"{Encode(description)}\">");
        html.Append($"<meta property=\"og:url\" content=\"{Encode(url)}\">");
        if (image is not null)
        {
            html.Append($"<meta property=\"og:image\" content=\"{Encode(image)}\">");
        }
        html.Append($"<meta name=\"twitter:card\" content=\"{(image is null ? "summary" : "summary_large_image")}\">");
        // Lỡ người thật mở được trang này thì đưa sang trang bài.
        html.Append($"<meta http-equiv=\"refresh\" content=\"0; url={Encode(url)}\">");
        html.Append($"</head><body><p><a href=\"{Encode(url)}\">{Encode(title)}</a></p><p>{Encode(description)}</p></body></html>");
        return html.ToString();
    }

    // Chỉ thoát 5 ký tự đặc biệt của HTML, giữ nguyên chữ tiếng Việt (HtmlEncode đổi cả chữ có dấu thành &#...;).
    private static string Encode(string value)
    {
        return value.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;").Replace("'", "&#39;");
    }
}
