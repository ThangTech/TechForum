using CloudinaryDotNet.Actions;

namespace TechForum.Api.Services;

// The automatic check of pictures by the Amazon Rekognition AI Moderation add-on of Cloudinary (Cloudinary:ImageModeration).
// Cloudinary answers "approved" or "rejected" in the answer of the upload itself, so the member knows at once.
public static class CloudModeration
{
    // The sentence given to CloudMediaRejectedException for a picture the check refused (see CloudRejection.ToMessage).
    public const string RejectedMessage = "Image rejected by moderation";

    public static bool IsRejected(IEnumerable<Moderation>? results)
    {
        return results?.Any(result => result.Status == ModerationStatus.Rejected) == true;
    }

    // An error that comes from the add-on and not from the file: the add-on is not registered, or the free units of the
    // month are used up. The picture is then uploaded without the check, so the site keeps working.
    public static bool IsUnavailable(string? errorMessage)
    {
        var text = errorMessage?.ToLowerInvariant() ?? string.Empty;
        return text.Contains("moderation") || text.Contains("add-on") || text.Contains("addon") ||
            text.Contains("aws_rek") || text.Contains("subscription") || text.Contains("quota");
    }
}
