using TechForum.Api.Dtos;

namespace TechForum.Api.Services;

public interface IAdminAccountService
{
    Task<PagedResultDto<AdminAccountDto>> GetPageAsync(
        string? keyword,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
    Task<AdminAccountWriteResult> SetLockedAsync(
        string targetUserId,
        string administratorId,
        bool isLocked,
        CancellationToken cancellationToken);
}
