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

    Task<OwnTopicDto?> GetOwnedByIdAsync(
        int id,
        string authorId,
        CancellationToken cancellationToken);

    Task<CreateTopicResult> CreateAsync(
        string authorId,
        CreateTopicRequest request,
        CancellationToken cancellationToken);

    Task<CreateTopicResult?> UpdateAsync(
        int id,
        string authorId,
        UpdateTopicRequest request,
        CancellationToken cancellationToken);

    Task<bool> SoftDeleteAsync(
        int id,
        string authorId,
        CancellationToken cancellationToken);
}
