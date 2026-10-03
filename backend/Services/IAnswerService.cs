using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IAnswerService
{
    Task<PagedResultDto<AnswerDto>?> GetPublicPageAsync(
        int topicId,
        AnswerQuery query,
        CancellationToken cancellationToken);

    Task<CreateAnswerResult> CreateAsync(
        int topicId,
        string authorId,
        CreateAnswerRequest request,
        CancellationToken cancellationToken);
}
