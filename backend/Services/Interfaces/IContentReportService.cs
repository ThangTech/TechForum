using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IContentReportService
{
    Task<CreateReportResult> CreateAsync(
        string reporterId,
        CreateReportRequest request,
        CancellationToken cancellationToken);
}
