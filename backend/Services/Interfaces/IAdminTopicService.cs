using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IAdminTopicService
{
    Task<PagedResultDto<AdminTopicDto>?> GetPageAsync(AdminTopicQuery query, CancellationToken cancellationToken);
    Task<AdminTopicWriteResult> ModerateAsync(
        int topicId,
        string administratorId,
        ModerateTopicRequest request,
        CancellationToken cancellationToken);
}
