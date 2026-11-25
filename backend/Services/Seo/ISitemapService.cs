namespace TechForum.Api.Services;

public interface ISitemapService
{
    Task<Result<string>> BuildAsync(CancellationToken cancellationToken);
}
