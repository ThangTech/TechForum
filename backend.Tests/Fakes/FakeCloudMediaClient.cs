using TechForum.Api.Services;

namespace TechForum.Api.Tests.Fakes;

// Thay cho Cloudinary trong test, không đi qua mạng. Địa chỉ trả về có dạng giống Cloudinary để kiểm tra được quy tắc của site.
public sealed class FakeCloudMediaClient : ICloudMediaClient
{
    public bool IsConfigured { get; set; } = true;

    // (id trên Cloudinary, loại, tên tệp) của mỗi lần tải lên.
    public List<(string PublicId, CloudResourceType Type, string FileName)> Uploads { get; } = [];

    public List<CloudAsset> Deleted { get; } = [];

    // Giả lập Cloudinary không kết nối được.
    public bool Fails { get; set; }

    // Giả lập Cloudinary từ chối chính tệp (kết nối vẫn tốt).
    public string? RejectWith { get; set; }

    // Trả địa chỉ này thay cho địa chỉ đúng.
    public string? AddressToReturn { get; set; }

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

        if (RejectWith is not null)
        {
            throw new CloudMediaRejectedException(RejectWith);
        }

        // Đọc hết các byte như client thật làm khi gửi tệp.
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
