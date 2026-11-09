using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Services;

namespace TechForum.Api.Tests.Fakes;

// The address rules of the tests: the Cloudinary account "demo-cloud" with the folder "techforum", and the old
// local addresses under /media. Pass an empty cloud name to get a site that has no Cloudinary account.
public static class TestMediaRules
{
    public const string CloudName = "demo-cloud";

    public static MediaUrlRules Create(string cloudName = CloudName, string folder = "techforum") => new(
        Options.Create(new CloudinaryOptions { CloudName = cloudName, ApiKey = "key", ApiSecret = "secret", Folder = folder }),
        Options.Create(new MediaOptions()));

    public static ContentSanitizer CreateSanitizer() => new(Create());
}
