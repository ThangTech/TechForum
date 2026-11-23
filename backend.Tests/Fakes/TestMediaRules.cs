using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Services;

namespace TechForum.Api.Tests.Fakes;

// Tài khoản Cloudinary "demo-cloud", thư mục "techforum", và địa chỉ cũ dưới /media. Cloud name rỗng là site không có Cloudinary.
public static class TestMediaRules
{
    public const string CloudName = "demo-cloud";

    public static MediaUrlRules Create(string cloudName = CloudName, string folder = "techforum") => new(
        Options.Create(new CloudinaryOptions { CloudName = cloudName, ApiKey = "key", ApiSecret = "secret", Folder = folder }),
        Options.Create(new MediaOptions()));

    public static ContentSanitizer CreateSanitizer() => new(Create());
}
