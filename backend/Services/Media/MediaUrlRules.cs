using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;

namespace TechForum.Api.Services;

public enum CloudResourceType
{
    Image,
    Video
}

// Tệp trên Cloudinary nhận ra từ địa chỉ: loại tệp và id Cloudinary dùng để xóa (thư mục và tên, không có đuôi).
public sealed record CloudAsset(CloudResourceType ResourceType, string PublicId);

// Nơi duy nhất quy định địa chỉ ảnh và video nào thuộc site này, để bộ làm sạch HTML, TopicService và việc dọn tệp
// nhận ra giống nhau. Có hai loại: tệp trên Cloudinary của site, và tệp cũ trên đĩa (/media/images/...) để bài cũ
// vẫn còn ảnh.
public sealed class MediaUrlRules
{
    // Bằng độ dài cột lưu ảnh bìa.
    public const int MaxCoverLength = 300;

    private const string Id = "[a-f0-9]{32}";

    private readonly string cloudFolder;
    private readonly Regex topicMedia;
    private readonly Regex topicMediaWhole;
    private readonly Regex firstImage;
    private readonly Regex? cloudAsset;
    private readonly Regex? cloudAvatar;
    private readonly Regex? cloudBanner;

    public MediaUrlRules(IOptions<CloudinaryOptions> cloudinaryOptions, IOptions<MediaOptions> mediaOptions)
    {
        var local = Regex.Escape("/" + mediaOptions.Value.RequestPath.Trim('/'));
        var cloud = cloudinaryOptions.Value;
        cloudFolder = cloud.Folder.Trim('/');

        var localImage = $"{local}/images/{Id}\\.(?:png|jpg|gif|webp)";
        var localVideo = $"{local}/videos/{Id}\\.(?:mp4|webm)";
        var imageAddress = localImage;
        var videoAddress = localVideo;

        if (!string.IsNullOrWhiteSpace(cloud.CloudName))
        {
            var prefix = $"https://res\\.cloudinary\\.com/{Regex.Escape(cloud.CloudName)}";
            var folder = Regex.Escape(cloud.Folder.Trim('/'));
            imageAddress += $"|{prefix}/image/upload/(?:v\\d+/)?{folder}/images/{Id}\\.(?:png|jpg|gif|webp)";
            videoAddress += $"|{prefix}/video/upload/(?:v\\d+/)?{folder}/videos/{Id}\\.(?:mp4|webm)";

            cloudAsset = new Regex(
                $"^{prefix}/(?<type>image|video)/upload/(?:v\\d+/)?(?<id>{folder}/(?:images|videos|avatars|banners)/{Id})\\.[a-z0-9]+$",
                RegexOptions.CultureInvariant);
            cloudAvatar = new Regex(
                $"^{prefix}/image/upload/(?:v\\d+/)?{folder}/avatars/{Id}\\.(?:png|jpg|webp)$",
                RegexOptions.CultureInvariant);
            cloudBanner = new Regex(
                $"^{prefix}/image/upload/(?:v\\d+/)?{folder}/banners/{Id}\\.(?:png|jpg|webp)$",
                RegexOptions.CultureInvariant);
        }

        // Bộ làm sạch luôn viết thuộc tính bằng dấu nháy kép, nên tìm theo src="...".
        topicMedia = new Regex($"(?:{imageAddress})|(?:{videoAddress})", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        topicMediaWhole = new Regex($"^(?:(?:{imageAddress})|(?:{videoAddress}))$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        firstImage = new Regex($"<img\\b[^>]*?\\bsrc=\"({imageAddress})\"", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    // Thư mục của site, loại tệp (images, videos, avatars, banners) và tên ngẫu nhiên; Cloudinary tự thêm đuôi.
    public string CreatePublicId(string kind, Guid id) => $"{cloudFolder}/{kind}/{id:N}";

    public bool IsTopicMediaUrl(string url) => topicMediaWhole.IsMatch(url);

    public IReadOnlyList<string> FindTopicMediaUrls(string html)
    {
        return topicMedia.Matches(html).Select(match => match.Value).ToList();
    }

    // Null khi không có ảnh hoặc địa chỉ dài hơn cột ảnh bìa.
    public string? FindFirstImageUrl(string html)
    {
        var match = firstImage.Match(html);
        return match.Success && match.Groups[1].Length <= MaxCoverLength ? match.Groups[1].Value : null;
    }

    public bool IsCloudAvatarUrl(string url) => cloudAvatar?.IsMatch(url) == true;

    public bool IsCloudBannerUrl(string url) => cloudBanner?.IsMatch(url) == true;

    // Null với địa chỉ trên đĩa hoặc của site khác, để không bao giờ xóa nhầm tệp ngoài thư mục của site.
    public CloudAsset? TryGetCloudAsset(string? url)
    {
        var match = url is null ? null : cloudAsset?.Match(url);
        if (match == null || !match.Success)
        {
            return null;
        }

        var type = match.Groups["type"].Value == "video" ? CloudResourceType.Video : CloudResourceType.Image;
        return new CloudAsset(type, match.Groups["id"].Value);
    }
}
