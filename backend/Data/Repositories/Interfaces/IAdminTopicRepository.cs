using TechForum.Api.Dtos;
using TechForum.Api.Enums;
using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IAdminTopicRepository
{
    Task<AdminTopicPage> GetPageAsync(
        AdminTopicQuery query,
        TopicType? type,
        CancellationToken cancellationToken);
    Task<Topic?> GetTrackedByIdAsync(int id, CancellationToken cancellationToken);
    Task<Category?> GetActiveCategoryAsync(int id, CancellationToken cancellationToken);
    Task<bool> SaveWithAuditAsync(AdminAuditLog auditLog, Notification? notification, CancellationToken cancellationToken);
}
