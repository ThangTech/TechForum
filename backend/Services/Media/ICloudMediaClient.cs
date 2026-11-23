namespace TechForum.Api.Services;

public class CloudMediaException(string message, Exception? innerException = null)
    : Exception(message, innerException);

// Cloudinary nhận được yêu cầu nhưng từ chối tệp (quá lớn, quá nhiều điểm ảnh, tệp hỏng): báo được cho thành viên.
public sealed class CloudMediaRejectedException(string cloudMessage)
    : CloudMediaException($"Cloudinary từ chối tệp: {cloudMessage}.")
{
    public string CloudMessage { get; } = cloudMessage;
}

// Class duy nhất nói chuyện với Cloudinary, để phần kiểm tra tệp (kích thước, loại, chủ sở hữu)
// viết một lần và test được mà không cần mạng.
public interface ICloudMediaClient
{
    bool IsConfigured { get; }

    Task<string> UploadAsync(
        Stream content,
        string fileName,
        CloudResourceType resourceType,
        string publicId,
        CancellationToken cancellationToken);

    // Tệp đã không còn thì không tính là lỗi.
    Task DeleteAsync(CloudAsset asset, CancellationToken cancellationToken);
}
