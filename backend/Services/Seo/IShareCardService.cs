namespace TechForum.Api.Services;

public interface IShareCardService
{
    // Trang HTML nhỏ chỉ có thẻ Open Graph của bài, cho bot mạng xã hội (Facebook, Zalo...) vốn không chạy JavaScript.
    Task<ShareCard> GetTopicCardAsync(Guid topicId, CancellationToken cancellationToken);
}

public sealed record ShareCard(bool Found, string Html);
