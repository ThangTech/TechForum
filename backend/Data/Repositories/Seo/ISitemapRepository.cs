namespace TechForum.Api.Data.Repositories;

public sealed record SitemapTopic(Guid Id, DateTimeOffset LastModifiedUtc);

public interface ISitemapRepository
{
    Task<IReadOnlyList<SitemapTopic>> GetPublicTopicsAsync(int maxCount, CancellationToken cancellationToken);
}
