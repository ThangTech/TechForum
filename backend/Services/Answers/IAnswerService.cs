using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IAnswerService
{
    Task<PagedResultDto<AnswerDto>?> GetPublicPageAsync(
        Guid topicId,
        AnswerQuery query,
        CancellationToken cancellationToken,
        string? viewerId = null);

    Task<Result<AnswerDto>> CreateAsync(
        Guid topicId,
        string authorId,
        CreateAnswerRequest request,
        CancellationToken cancellationToken);

    Task<Result<AnswerDto>> AcceptAsync(
        Guid topicId,
        Guid answerId,
        string authorId,
        CancellationToken cancellationToken);

    Task<Result<AnswerDto>> UpdateAsync(
        Guid topicId,
        Guid answerId,
        string authorId,
        CreateAnswerRequest request,
        CancellationToken cancellationToken);

    Task<Result> DeleteAsync(
        Guid topicId,
        Guid answerId,
        string authorId,
        CancellationToken cancellationToken);
}
