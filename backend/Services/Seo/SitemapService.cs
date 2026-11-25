using System.Xml.Linq;
using Microsoft.Extensions.Options;
using TechForum.Api.Configuration;
using TechForum.Api.Data.Repositories;

namespace TechForum.Api.Services;

// sitemap.xml cho Google: các trang chính và mọi bài công khai, theo địa chỉ thật của trang web (FrontendUrl).
public sealed class SitemapService : ISitemapService
{
    // Giới hạn của một file sitemap là 50.000 địa chỉ; diễn đàn nhỏ nên lấy 5.000 bài mới nhất là đủ.
    private const int MaxTopics = 5000;
    private static readonly string[] MainPages = ["/", "/articles", "/questions", "/discussions", "/privacy", "/terms"];
    private static readonly XNamespace SitemapNamespace = "http://www.sitemaps.org/schemas/sitemap/0.9";

    private readonly ISitemapRepository repository;
    private readonly RecoveryEmailOptions siteOptions;

    public SitemapService(ISitemapRepository repository, IOptions<RecoveryEmailOptions> siteOptions)
    {
        this.repository = repository;
        this.siteOptions = siteOptions.Value;
    }

    public async Task<Result<string>> BuildAsync(CancellationToken cancellationToken)
    {
        if (!siteOptions.TryGetFrontendUrl(out var siteUrl))
        {
            return Result<string>.Fail(ErrorType.Unavailable, "Chưa có sitemap", "Chưa cấu hình địa chỉ trang web.");
        }

        var topics = await repository.GetPublicTopicsAsync(MaxTopics, cancellationToken);
        var urls = MainPages.Select(path => CreateUrl(siteUrl + path, null))
            .Concat(topics.Select(topic => CreateUrl($"{siteUrl}/topics/{topic.Id}", topic.LastModifiedUtc)));
        var document = new XDocument(new XDeclaration("1.0", "utf-8", null), new XElement(SitemapNamespace + "urlset", urls));
        return Result<string>.Success(document.Declaration + Environment.NewLine + document.Root);
    }

    private static XElement CreateUrl(string location, DateTimeOffset? lastModifiedUtc)
    {
        var url = new XElement(SitemapNamespace + "url", new XElement(SitemapNamespace + "loc", location));
        if (lastModifiedUtc is not null)
        {
            url.Add(new XElement(SitemapNamespace + "lastmod", lastModifiedUtc.Value.UtcDateTime.ToString("yyyy-MM-dd")));
        }
        return url;
    }
}
