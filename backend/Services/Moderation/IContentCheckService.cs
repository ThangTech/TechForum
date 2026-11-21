using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

// Tells a member, while they write, which words the filter would replace by "***". Nothing is saved.
public interface IContentCheckService
{
    Task<ContentCheckResultDto> CheckAsync(CheckContentRequest request, CancellationToken cancellationToken);
}
