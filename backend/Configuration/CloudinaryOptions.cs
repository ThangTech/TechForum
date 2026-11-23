namespace TechForum.Api.Configuration;

// The account that stores the pictures and videos of the site. The three values come from the Cloudinary dashboard.
// They are secrets: put them in user-secrets or environment variables (Cloudinary__CloudName, Cloudinary__ApiKey,
// Cloudinary__ApiSecret), never in a file that is committed.
public sealed class CloudinaryOptions
{
    public const string SectionName = "Cloudinary";

    public string CloudName { get; init; } = string.Empty;
    public string ApiKey { get; init; } = string.Empty;
    public string ApiSecret { get; init; } = string.Empty;

    // The folder in the account that holds everything of this site, so one account can serve more than one site
    // (for example "techforum" and "techforum-dev").
    public string Folder { get; init; } = "techforum";

    // The automatic check of pictures when they are uploaded, for example "aws_rek" (Amazon Rekognition AI Moderation).
    // The add-on must be registered in the Cloudinary console first. Empty: pictures are not checked.
    public string ImageModeration { get; init; } = string.Empty;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(CloudName) &&
        !string.IsNullOrWhiteSpace(ApiKey) &&
        !string.IsNullOrWhiteSpace(ApiSecret);
}
