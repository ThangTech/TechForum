using TechForum.Api.Models;

namespace TechForum.Api.Data.Repositories;

public interface IContentReportRepository
{
    Task<Answer?> GetPublicAnswerAsync(int answerId, CancellationToken cancellationToken);
    Task<bool> PendingExistsAsync(string reporterId, int? topicId, int? answerId, CancellationToken cancellationToken);
    Task<bool> AddAsync(ContentReport report, CancellationToken cancellationToken);
}
