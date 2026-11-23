using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

// Dùng đúng bộ lọc làm sạch bài khi lưu, nên điều được cảnh báo chính là điều sẽ bị thay.
public sealed class ContentCheckService : IContentCheckService
{
    private readonly IProfanityFilter profanityFilter;

    public ContentCheckService(IProfanityFilter profanityFilter)
    {
        this.profanityFilter = profanityFilter;
    }

    public async Task<ContentCheckResultDto> CheckAsync(CheckContentRequest request, CancellationToken cancellationToken)
    {
        var title = await CleanIfChangedAsync(request.Title, false, cancellationToken);
        var summary = await CleanIfChangedAsync(request.Summary, false, cancellationToken);
        var body = await CleanIfChangedAsync(request.BodyHtml, true, cancellationToken);
        return new ContentCheckResultDto(title is not null || summary is not null || body is not null, title, summary, body);
    }

    private async Task<string?> CleanIfChangedAsync(string? text, bool isHtml, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(text)) return null;
        var cleaned = await profanityFilter.FilterAsync(text, isHtml, cancellationToken);
        return string.Equals(cleaned, text, StringComparison.Ordinal) ? null : cleaned;
    }
}
