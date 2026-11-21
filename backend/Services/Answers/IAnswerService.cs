using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IAnswerService
{
    Task<PagedResultDto<AnswerDto>?> GetPublicPageAsync(
        Guid topicId,
        AnswerQuery query,
        CancellationToken cancellationToken,
        string? viewerId = null);

    Task<AnswerHelpfulResult> SetHelpfulAsync(
        Guid topicId,
        Guid answerId,
        string userId,
        bool isHelpful,
        CancellationToken cancellationToken);

    Task<CreateAnswerResult> CreateAsync(
        Guid topicId,
        string authorId,
        CreateAnswerRequest request,
        CancellationToken cancellationToken);

    Task<AcceptAnswerResult> AcceptAsync(
        Guid topicId,
        Guid answerId,
        string authorId,
        CancellationToken cancellationToken);

    Task<UpdateAnswerResult> UpdateAsync(
        Guid topicId,
        Guid answerId,
        string authorId,
        CreateAnswerRequest request,
        CancellationToken cancellationToken);

    Task<bool> DeleteAsync(
        Guid topicId,
        Guid answerId,
        string authorId,
        CancellationToken cancellationToken);
}
