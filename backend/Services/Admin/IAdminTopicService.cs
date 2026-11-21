using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IAdminTopicService
{
    Task<PagedResultDto<AdminTopicDto>?> GetPageAsync(AdminTopicQuery query, CancellationToken cancellationToken);
    Task<AdminTopicDetailDto?> GetByIdAsync(Guid topicId, CancellationToken cancellationToken);
    Task<AdminTopicWriteResult> ModerateAsync(
        Guid topicId,
        string administratorId,
        ModerateTopicRequest request,
        CancellationToken cancellationToken);
}
