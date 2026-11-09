using TechForum.Api.Services;

namespace TechForum.Api.Tests.Fakes;

// Stands in for the Cloudinary account in the tests: nothing goes over the network. An upload gives back an address
// built like the one of Cloudinary, so the rules of the site can be checked on it.
public sealed class FakeCloudMediaClient : ICloudMediaClient
{
    public bool IsConfigured { get; set; } = true;

    // Every upload that was made: (id in the account, kind, name of the file).
    public List<(string PublicId, CloudResourceType Type, string FileName)> Uploads { get; } = [];

    public List<CloudAsset> Deleted { get; } = [];

    // Set to act like Cloudinary being unreachable (upload and delete fail).
    public bool Fails { get; set; }

    // Set to a text to give that address back instead of a correct one.
    public string? AddressToReturn { get; set; }

    // Ids of the files that cannot be deleted (the others can).
    public HashSet<string> UndeletableIds { get; } = [];

    public Task<string> UploadAsync(
        Stream content,
        string fileName,
        CloudResourceType resourceType,
        string publicId,
        CancellationToken cancellationToken)
    {
        if (Fails)
        {
            throw new CloudMediaException("Cloudinary không phản hồi.");
        }

        // The bytes are read, like the real client does when it sends the file.
        using var buffer = new MemoryStream();
        content.CopyTo(buffer);

        Uploads.Add((publicId, resourceType, fileName));
        var extension = Path.GetExtension(fileName);
        var kind = resourceType == CloudResourceType.Video ? "video" : "image";
        return Task.FromResult(AddressToReturn ??
            $"https://res.cloudinary.com/{TestMediaRules.CloudName}/{kind}/upload/v1699999999/{publicId}{extension}");
    }

    public Task DeleteAsync(CloudAsset asset, CancellationToken cancellationToken)
    {
        if (Fails || UndeletableIds.Contains(asset.PublicId))
        {
            throw new CloudMediaException("Cloudinary không phản hồi.");
        }

        Deleted.Add(asset);
        return Task.CompletedTask;
    }
}
