namespace TechForum.Api.Models;

public sealed class MediaAsset
{
    public Guid Id { get; set; }
    public required string UploaderId { get; set; }
    public ApplicationUser Uploader { get; set; } = null!;
    public required string RelativePath { get; set; }
    public required string PublicUrl { get; set; }
    public required string ContentType { get; set; }
    public long Length { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public int? TopicId { get; set; }
    public Topic? Topic { get; set; }
}
