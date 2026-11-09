namespace TechForum.Api.Services;

// The upload went wrong at Cloudinary (no connection, refused keys, a file it did not accept).
public class CloudMediaException(string message, Exception? innerException = null)
    : Exception(message, innerException);

// Cloudinary was reached and said no to this file (too big, too many pixels, a broken file). The connection is fine, so the
// member can be told what is wrong with the file. CloudMessage is the sentence of Cloudinary.
public sealed class CloudMediaRejectedException(string cloudMessage)
    : CloudMediaException($"Cloudinary từ chối tệp: {cloudMessage}.")
{
    public string CloudMessage { get; } = cloudMessage;
}

// The only class of the site that talks to Cloudinary. The rest of the code asks for an upload or a delete and does
// not know the Cloudinary library, so the checks of a file (size, type, owner) are written once and tested without
// a network.
public interface ICloudMediaClient
{
    // False until CloudName, ApiKey and ApiSecret are set. Uploading and deleting are not possible then.
    bool IsConfigured { get; }

    // Sends the stream to Cloudinary under that id (the folder and the name without the extension) and gives back
    // the https address of the file.
    Task<string> UploadAsync(
        Stream content,
        string fileName,
        CloudResourceType resourceType,
        string publicId,
        CancellationToken cancellationToken);

    // Removes the file. A file that is already gone is not an error.
    Task DeleteAsync(CloudAsset asset, CancellationToken cancellationToken);
}
