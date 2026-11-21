using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

// It uses the same filter that cleans a post or an answer when it is saved, so what the member is warned about is
// exactly what will be changed.
public sealed class ContentCheckService(IProfanityFilter profanityFilter) : IContentCheckService
{
    public async Task<ContentCheckResultDto> CheckAsync(CheckContentRequest request, CancellationToken cancellationToken)
    {
        var title = await CleanIfChangedAsync(request.Title, false, cancellationToken);
        var summary = await CleanIfChangedAsync(request.Summary, false, cancellationToken);
        var body = await CleanIfChangedAsync(request.BodyHtml, true, cancellationToken);
        return new ContentCheckResultDto(title is not null || summary is not null || body is not null, title, summary, body);
    }

    // The cleaned text, or null when the text is empty or the filter changes nothing.
    private async Task<string?> CleanIfChangedAsync(string? text, bool isHtml, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(text)) return null;
        var cleaned = await profanityFilter.FilterAsync(text, isHtml, cancellationToken);
        return string.Equals(cleaned, text, StringComparison.Ordinal) ? null : cleaned;
    }
}
