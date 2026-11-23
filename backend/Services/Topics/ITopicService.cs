using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface ITopicService
{
    Task<PagedResultDto<TopicSummaryDto>> GetPublicPageAsync(
        TopicQuery query,
        CancellationToken cancellationToken);

    Task<PagedResultDto<TopicSummaryDto>> GetFollowingPageAsync(
        string followerId,
        TopicQuery query,
        CancellationToken cancellationToken);

    Task<PagedResultDto<OwnTopicSummaryDto>> GetOwnedPageAsync(
        string authorId,
        TopicQuery query,
        CancellationToken cancellationToken);

    Task<TopicDetailDto?> GetPublicByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<OwnTopicDto?> GetOwnedByIdAsync(
        Guid id,
        string authorId,
        CancellationToken cancellationToken);

    Task<Result<OwnTopicDto>> CreateAsync(
        string authorId,
        CreateTopicRequest request,
        CancellationToken cancellationToken);

    Task<Result<OwnTopicDto>> UpdateAsync(
        Guid id,
        string authorId,
        UpdateTopicRequest request,
        CancellationToken cancellationToken);

    Task<Result> SoftDeleteAsync(
        Guid id,
        string authorId,
        CancellationToken cancellationToken);
}
