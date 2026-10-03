using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ITopicService
{
    Task<PagedResultDto<TopicSummaryDto>> GetPublicPageAsync(
        TopicQuery query,
        CancellationToken cancellationToken);

    Task<PagedResultDto<OwnTopicSummaryDto>> GetOwnedPageAsync(
        string authorId,
        TopicQuery query,
        CancellationToken cancellationToken);

    Task<TopicDetailDto?> GetPublicByIdAsync(int id, CancellationToken cancellationToken);

    Task<CreateTopicResult> CreateAsync(
        string authorId,
        CreateTopicRequest request,
        CancellationToken cancellationToken);
}
