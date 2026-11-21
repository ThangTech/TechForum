using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;

namespace TechForum.Api.Services;

public enum CloudResourceType
{
    Image,
    Video
}

// A file in the Cloudinary account, found from its address: what kind it is and the id that Cloudinary uses to
// delete it (the folder and the name, without the extension).
public sealed record CloudAsset(CloudResourceType ResourceType, string PublicId);

// The one place that says which addresses of pictures and videos belong to this site. The sanitizer, the topic
// service and the cleanup all ask it, so a picture of another site (or of another Cloudinary account) is
// recognised in the same way everywhere.
//
// Two kinds of address belong to the site:
// - the files that the site uploads to Cloudinary: https://res.cloudinary.com/{cloud}/image/upload/v123/{folder}/images/{id}.png
// - the files that were stored on the disk before the move to Cloudinary: /media/images/{id}.png. They stay readable so
//   that the old topics keep their pictures.
public sealed class MediaUrlRules
{
    // The address of the cover picture is kept in a column of this length.
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

            // The groups give what Cloudinary needs to delete the file.
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

        // The sanitizer writes an attribute with double quotes, so a picture is found by its src="...".
        topicMedia = new Regex($"(?:{imageAddress})|(?:{videoAddress})", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        topicMediaWhole = new Regex($"^(?:(?:{imageAddress})|(?:{videoAddress}))$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        firstImage = new Regex($"<img\\b[^>]*?\\bsrc=\"({imageAddress})\"", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    // The id for a new file in the Cloudinary account: the folder of the site, the kind of file
    // (images, videos, avatars or banners) and a random name. Cloudinary adds the extension to the address.
    public string CreatePublicId(string kind, Guid id) => $"{cloudFolder}/{kind}/{id:N}";

    // A picture or a video that may appear in the content of a topic.
    public bool IsTopicMediaUrl(string url) => topicMediaWhole.IsMatch(url);

    // Every picture and video address in the (sanitized) HTML of a topic.
    public IReadOnlyList<string> FindTopicMediaUrls(string html) =>
        topicMedia.Matches(html).Select(match => match.Value).ToList();

    // The address of the first picture of the (already sanitized) body, or null when there is none or when it is
    // too long for the cover column.
    public string? FindFirstImageUrl(string html)
    {
        var match = firstImage.Match(html);
        return match.Success && match.Groups[1].Length <= MaxCoverLength ? match.Groups[1].Value : null;
    }

    public bool IsCloudAvatarUrl(string url) => cloudAvatar?.IsMatch(url) == true;

    public bool IsCloudBannerUrl(string url) => cloudBanner?.IsMatch(url) == true;

    // The file in the Cloudinary account that this address points to. Null for an address of the disk or of another
    // site, so nothing outside this site's folder can be deleted by mistake.
    public CloudAsset? TryGetCloudAsset(string? url)
    {
        var match = url is null ? null : cloudAsset?.Match(url);
        if (match is not { Success: true })
        {
            return null;
        }

        var type = match.Groups["type"].Value == "video" ? CloudResourceType.Video : CloudResourceType.Image;
        return new CloudAsset(type, match.Groups["id"].Value);
    }
}
